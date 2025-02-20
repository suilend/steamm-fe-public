#!/bin/bash
trap 'echo "Error at line $LINENO: $(caller) -> Command [$BASH_COMMAND] failed with exit code $?" >&2; exit 1' ERR
set -eE

# Parse command line arguments
CI=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --ci) CI=true ;;
        *) echo "Unknown parameter: $1"; return 1 ;;
    esac
    shift
done

if [ "$CI" = false ]; then
    # Cleanup
    ./bin/unpublocal.sh

    # Create suilend directory if it doesn't exist and cd into it
    mkdir -p temp &&
    git clone --branch develop git@github.com:solendprotocol/steamm.git temp/git
else
    ./bin/unpublocal.sh --ci
fi

# Check if current environment is localnet
INITIAL_ENV=$(sui client --client.config sui/client.yaml envs --json | grep -oE '"[^"]*"' | tail -n1 | tr -d '"')

if [ "$INITIAL_ENV" != "localnet" ]; then
    printf "Current environment is: $INITIAL_ENV. Switching to localnet..." >&2
    sui client --client.config sui/client.yaml switch --env localnet
fi


# Create source directories
printf "[INFO] Building Steamm package"  >&2
mkdir -p temp/liquid_staking/sources temp/pyth/sources temp/sprungsui/sources temp/suilend/sources temp/wormhole/sources temp/steamm/sources temp/steamm_scripts/sources
sui move build --path temp/git/contracts/steamm --silence-warnings --no-lint

# Copy dependencies from build to local directories
printf "[INFO] Copying state"  >&2
cp -r temp/git/contracts/steamm/build/steamm/sources/dependencies/liquid_staking/* temp/liquid_staking/sources/
cp -r temp/git/contracts/steamm/build/steamm/sources/dependencies/Pyth/* temp/pyth/sources/
cp -r temp/git/contracts/steamm/build/steamm/sources/dependencies/sprungsui/* temp/sprungsui/sources/
cp -r temp/git/contracts/steamm/build/steamm/sources/dependencies/suilend/* temp/suilend/sources/
cp -r temp/git/contracts/steamm/build/steamm/sources/dependencies/Wormhole/* temp/wormhole/sources/
cp -r temp/git/contracts/steamm/sources/* temp/steamm/sources/
cp -r temp/git/contracts/steamm_scripts/sources/* temp/steamm_scripts/sources/

cp -r templates/setup temp/steamm/sources/
cp -r templates/suilend_setup temp/suilend/sources/

# Copy Move.toml files from templates
cp templates/liquid_staking.toml temp/liquid_staking/Move.toml
cp templates/pyth.toml temp/pyth/Move.toml
cp templates/sprungsui.toml temp/sprungsui/Move.toml
cp templates/suilend.toml temp/suilend/Move.toml
cp templates/wormhole.toml temp/wormhole/Move.toml
cp templates/steamm.toml temp/steamm/Move.toml
cp templates/steamm_scripts.toml temp/steamm_scripts/Move.toml

##### 2. Publish contracts & populate TOMLs ####

# Function to populate TOML file with new address
populate_toml() {
    local NEW_ADDRESS="$1"
    local TOML_PATH="$2"

    # Check if both arguments are provided
    if [ -z "$NEW_ADDRESS" ] || [ -z "$TOML_PATH" ]; then
        printf "Usage: populate_toml <new_address> <path_to_move_toml>" >&2
        ./bin/unpublocal.sh # cleanup
        return 1
    fi

    # Check if the Move.toml file exists
    if [ ! -f "$TOML_PATH" ]; then
        printf "Error: Move.toml file not found at $TOML_PATH" >&2
        ./bin/unpublocal.sh # cleanup
        return 1
    fi

    # Use sed to replace any address that equals "0x0" in the [addresses] section
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS version
        sed -i '' '/\[addresses\]/,/^$/s/= "0x0"/= "'$NEW_ADDRESS'"/' "$TOML_PATH"
    else
        # Linux version
        sed -i '/\[addresses\]/,/^$/s/= "0x0"/= "'$NEW_ADDRESS'"/' "$TOML_PATH"
    fi

    return 0
}

populate_ts() {
    local PACKAGE_ID="$1"
    local PACKAGE_NAME="$2"
    local TS_FILE="tests/packages.ts"

    # Check if TS file exists
    if [ ! -f "$TS_FILE" ]; then
        printf "Error: TypeScript file not found at $TS_FILE" >&2
        ./bin/unpublocal.sh # cleanup
        return 1
    fi

    # Check if the package constant exists with empty value
    if grep -q "export const $PACKAGE_NAME = \"\";" "$TS_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS version
            sed -i '' "s/export const $PACKAGE_NAME = \"\"/export const $PACKAGE_NAME = \"$PACKAGE_ID\"/;" "$TS_FILE"
        else
            # Linux version
            sed -i "s/export const $PACKAGE_NAME = \"\"/export const $PACKAGE_NAME = \"$PACKAGE_ID\"/;" "$TS_FILE"
        fi
    else
        printf "export const $PACKAGE_NAME = \"\";"  >&2
        printf "Error: Constant $PACKAGE_NAME not found in $TS_FILE or has unexpected format" >&2
        ./bin/unpublocal.sh # cleanup
        return 1
    fi
}

publish_package() {
    local FOLDER_NAME="$1"
    local TS_CONST_NAME="$2"
    
    # Check if folder name is provided
    if [ -z "$FOLDER_NAME" ]; then
        printf "Error: Folder name is required" >&2
        ./bin/unpublocal.sh # cleanup
        return 1
    fi

    # Store current directory
    INITIAL_DIR=$(pwd)
    
    # Change to package directory
    RESPONSE=$(sui client --client.config sui/client.yaml publish $FOLDER_NAME --skip-dependency-verification --silence-warnings --no-lint --json)
    RESULT=$(echo "$RESPONSE" | jq -r '.effects.status.status')

    if [ $RESULT != "success" ]; then
        printf "Transaction Result: $RESULT \n" >&2
        printf "Transaction failed or status is not success \n" >&2
        return 1
    fi

    PACKAGE_ID=$(echo "$RESPONSE" | grep -A 3 '"type": "published"' | grep "packageId" | cut -d'"' -f4)

    if [ -z "$PACKAGE_ID" ]; then
        printf "Error: Package ID is empty" >&2
        ./bin/unpublocal.sh # cleanup
        return 1
    fi

    populate_toml "$PACKAGE_ID" "$FOLDER_NAME/Move.toml"
    populate_ts "$PACKAGE_ID" "$TS_CONST_NAME"

    echo "$RESPONSE"
}

find_object_id() {
    local json_content="$1"
    local regex_pattern="$2"

    # Extract objectChanges array from the JSON file
    OBJECTS=$(echo "$json_content" | jq -r ".objectChanges[] | select(.objectType?)")

    # Use the provided regex pattern to filter objects
    RESULT=$(echo "$OBJECTS" | jq -r --arg regex "$regex_pattern" 'select(.objectType | test($regex)) | .objectId')

    if [ -n "$RESULT" ]; then
        echo "$RESULT"
    else
        echo "$regex_pattern not found" >&2
        return 1
    fi
}

source_test_fun() {
    local module="$1"
    local move_module="$2"
    local function_name="$3"
    local file_path="temp/${module}/sources/${move_module}.move"

    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo "Error: File $file_path does not exist"
        return 1
    fi
    
    line_num=$(grep -n "$function_name" "$file_path" | cut -d: -f1)
    if [ -n "$line_num" ]; then
        # Delete the line before it (subtract 1 from line number)
        remove_line=$((line_num - 1))
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS version
            sed -i '' "${remove_line}d" "$file_path"
        else
            # Linux version
            sed -i "${remove_line}d" "$file_path"
        fi
    else
        echo "Function not found in file"
        return 1
    fi
}

source_package_fun() {
    local module="$1"
    local move_module="$2"
    local function_name="$3"
    local file_path="temp/${module}/sources/${move_module}.move"

    # Check if file exists
    if [ ! -f "$file_path" ]; then
        echo "Error: File $file_path does not exist"
        return 1
    fi
    
    # Replace "public(package) fun function_name" with "public fun function_name"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS version
        sed -i '' "s/public(package) fun $function_name/public fun $function_name/" "$file_path"
    else
        # Linux version
        sed -i "s/public(package) fun $function_name/public fun $function_name/" "$file_path"
    fi
}


## Source test functions
printf "[INFO] Sourcing test functions" >&2
source_test_fun "pyth" "price_info" "new_price_info_object_for_testing"
source_test_fun "pyth" "price_info" "update_price_info_object_for_testing"
source_package_fun "steamm_scripts" "events" "emit_event"

printf "[INFO] Publishing packages" >&2

sui client --client.config sui/client.yaml faucet
sleep 1

sui client --client.config sui/client.yaml addresses

LIQUID_STAKING_RESPONSE=$(publish_package "temp/liquid_staking" "LIQUID_STAKING_PKG_ID")
WORMHOLE_RESPONSE=$(publish_package "temp/wormhole" "WORMHOLE_PKG_ID")
SPRUNGSUI_RESPONSE=$(publish_package "temp/sprungsui" "SPRUNGSUI_PKG_ID") 
PYTH_RESPONSE=$(publish_package "temp/pyth" "PYTH_PKG_ID")
SUILEND_RESPONSE=$(publish_package "temp/suilend" "SUILEND_PKG_ID")
STEAMM_RESPONSE=$(publish_package "temp/steamm" "STEAMM_PKG_ID")
STEAMM_SCRIPT_RESPONSE=$(publish_package "temp/steamm_scripts" "STEAMM_SCRIPT_PKG_ID")

printf "[INFO] Fetching object IDs" >&2

LENDING_MARKET_PACKAGE_ID=$(echo "$SUILEND_RESPONSE" | grep -A 3 '"type": "published"' | grep "packageId" | cut -d'"' -f4)
# Get relevant object IDs
lending_market_registry=$(find_object_id "$SUILEND_RESPONSE" ".*::lending_market_registry::Registry")
echo "lending_market_registry: $lending_market_registry"

registry=$(find_object_id "$STEAMM_RESPONSE" ".*::registry::Registry")
echo "registry: $registry"

global_admin=$(find_object_id "$STEAMM_RESPONSE" ".*::global_admin::GlobalAdmin")
echo "global_admin: $global_admin"

lp_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::lp_usdc_sui::LP_USDC_SUI>")
echo "lp_metadata: $lp_metadata"

lp_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::lp_usdc_sui::LP_USDC_SUI>")
echo "lp_treasury_cap: $lp_treasury_cap"

usdc_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::usdc::USDC>")
echo "usdc_metadata: $usdc_metadata"

sui_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::sui::SUI>")
echo "sui_metadata: $sui_metadata"

usdc_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::usdc::USDC>")
echo "usdc_treasury_cap: $usdc_treasury_cap"

sui_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::sui::SUI>")
echo "sui_treasury_cap: $sui_treasury_cap"

sui_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::sui::SUI>")
echo "sui_metadata: $sui_metadata"

b_usdc_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::b_usdc::B_USDC>")
echo "b_usdc_metadata: $b_usdc_metadata"

b_sui_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::b_sui::B_SUI>")
echo "b_sui_metadata: $b_sui_metadata"

b_usdc_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::b_usdc::B_USDC>")
echo "b_usdc_treasury_cap: $b_usdc_treasury_cap"

b_sui_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::b_sui::B_SUI>")
echo "b_sui_treasury_cap: $b_sui_treasury_cap"

PACKAGE_ID=$(echo "$STEAMM_RESPONSE" | grep -A 3 '"type": "published"' | grep "packageId" | cut -d'"' -f4)
echo "PACKAGE_ID: $PACKAGE_ID"

SETUP_RESPONSE=$(sui client --client.config sui/client.yaml call --package "$PACKAGE_ID" --module setup --function setup --args "$lending_market_registry" "$registry" "$lp_metadata" "$lp_treasury_cap" "$usdc_metadata" "$sui_metadata" "$b_usdc_metadata" "$b_sui_metadata" "$b_usdc_treasury_cap" "$b_sui_treasury_cap" "0x6" --json)

lending_market=$(find_object_id "$SETUP_RESPONSE" ".*::lending_market::LendingMarket<")
echo "lending_market: $lending_market"
lending_market_type="$PACKAGE_ID::setup::LENDING_MARKET"
echo "lending_market_type: $lending_market_type"


populate_ts "$registry" "REGISTRY_ID"
populate_ts "$global_admin" "GLOBAL_ADMIN_ID"
populate_ts "$lending_market" "LENDING_MARKET_ID"
populate_ts "$lending_market_type" "LENDING_MARKET_TYPE"

# Reset back to initial environment
if [ "$INITIAL_ENV" != "localnet" ]; then
    echo "Switching back to previous environment"
    sui client --client.config sui/client.yaml switch --env "$INITIAL_ENV"
fi

if [ "$CI" = false ]; then
    # Export temporary private key to env - needed for tests
    ACTIVE_ADDRESS=$(sui client --client.config sui/client.yaml addresses --json | jq -r '.activeAddress')
    echo "Active address: $ACTIVE_ADDRESS"
    TEMP_KEY=$(sui keytool --keystore-path sui/sui.keystore export --key-identity $ACTIVE_ADDRESS --json | jq -r '.exportedPrivateKey')

    # Replace the TEMP_KEY variable in the .env file
    if grep -q '^TEMP_KEY=' .env; then
        sed -i '' "s|^TEMP_KEY=.*|TEMP_KEY=\"$TEMP_KEY\"|" .env
    else
        printf "\nTEMP_KEY=\"%s\"\n" $TEMP_KEY >> .env
    fi
else
    ./bin/unpublocal.sh --ci
fi