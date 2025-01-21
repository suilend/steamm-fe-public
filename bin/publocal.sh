#!/bin/bash
# Cleanup
./bin/unpublocal.sh

# Check if current environment is localnet
INITIAL_ENV=$(sui client envs --json | grep -oE '"[^"]*"' | tail -n1 | tr -d '"')

if [ "$INITIAL_ENV" != "localnet" ]; then
    echo "Current environment is: $INITIAL_ENV. Switching to localnet..."
    sui client switch --env localnet
fi

# Create suilend directory if it doesn't exist and cd into it
mkdir -p temp &&

# Create source directories
mkdir -p temp/liquid_staking/sources temp/pyth/sources temp/sprungsui/sources temp/suilend/sources temp/wormhole/sources temp/steamm/sources

# Copy dependencies from build to local directories
cp -r contracts/steamm/build/steamm/sources/dependencies/liquid_staking/* temp/liquid_staking/sources/
cp -r contracts/steamm/build/steamm/sources/dependencies/Pyth/* temp/pyth/sources/
cp -r contracts/steamm/build/steamm/sources/dependencies/sprungsui/* temp/sprungsui/sources/
cp -r contracts/steamm/build/steamm/sources/dependencies/suilend/* temp/suilend/sources/
cp -r contracts/steamm/build/steamm/sources/dependencies/Wormhole/* temp/wormhole/sources/
cp -r contracts/steamm/sources/* temp/steamm/sources/

cp -r templates/setup temp/steamm/sources/

# Copy Move.toml files from templates
cp templates/liquid_staking.toml temp/liquid_staking/Move.toml
cp templates/pyth.toml temp/pyth/Move.toml
cp templates/sprungsui.toml temp/sprungsui/Move.toml
cp templates/suilend.toml temp/suilend/Move.toml
cp templates/wormhole.toml temp/wormhole/Move.toml
cp templates/steamm.toml temp/steamm/Move.toml

##### 2. Publish contracts & populate TOMLs ####

# Function to populate TOML file with new address
populate_toml() {
    local NEW_ADDRESS="$1"
    local TOML_PATH="$2"

    # Check if both arguments are provided
    if [ -z "$NEW_ADDRESS" ] || [ -z "$TOML_PATH" ]; then
        echo "Usage: populate_toml <new_address> <path_to_move_toml>"
        ./bin/unpublocal.sh # cleanup
        exit 1
    fi

    # Check if the Move.toml file exists
    if [ ! -f "$TOML_PATH" ]; then
        echo "Error: Move.toml file not found at $TOML_PATH"
        ./bin/unpublocal.sh # cleanup
        exit 1
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
    local TS_FILE="sdk/tests/packages.ts"

    # Check if TS file exists
    if [ ! -f "$TS_FILE" ]; then
        echo "Error: TypeScript file not found at $TS_FILE"
        ./bin/unpublocal.sh # cleanup
        exit 1
    fi

    # Check if the package constant exists with empty value
    if grep -q "export const $PACKAGE_NAME = \"\";" "$TS_FILE"; then
        # Replace empty value with actual package ID
        sed -i "" "s/export const $PACKAGE_NAME = \"\"/export const $PACKAGE_NAME = \"$PACKAGE_ID\"/;" "$TS_FILE"
    else
        echo "export const $PACKAGE_NAME = \"\";"
        echo "Error: Constant $PACKAGE_NAME not found in $TS_FILE or has unexpected format"
        ./bin/unpublocal.sh # cleanup
        exit 1
    fi
}

publish_package() {
    local FOLDER_NAME="$1"
    local TS_CONST_NAME="$2"
    
    # Check if folder name is provided
    if [ -z "$FOLDER_NAME" ]; then
        echo "Error: Folder name is required"
        ./bin/unpublocal.sh # cleanup
        exit 1
    fi

    # Store current directory
    INITIAL_DIR=$(pwd)
    
    # Change to package directory
    cd "$FOLDER_NAME"
    RESPONSE=$(sui client publish --silence-warnings --no-lint --json)
    cd "$INITIAL_DIR"

    PACKAGE_ID=$(echo "$RESPONSE" | grep -A 3 '"type": "published"' | grep "packageId" | cut -d'"' -f4)

    if [ -z "$PACKAGE_ID" ]; then
        echo "Error: Package ID is empty"
        ./bin/unpublocal.sh # cleanup
        exit 1
    fi

    # echo "Package ID: $PACKAGE_ID"
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


LIQUID_STAKING_RESPONSE=$(publish_package "temp/liquid_staking" "LIQUID_STAKING_PKG_ID")
WORMHOLE_RESPONSE=$(publish_package "temp/wormhole" "WORMHOLE_PKG_ID")
SPRUNGSUI_RESPONSE=$(publish_package "temp/sprungsui" "SPRUNGSUI_PKG_ID") 
PYTH_RESPONSE=$(publish_package "temp/pyth" "PYTH_PKG_ID")
SUILEND_RESPONSE=$(publish_package "temp/suilend" "SUILEND_PKG_ID")
STEAMM_RESPONSE=$(publish_package "temp/steamm" "STEAMM_PKG_ID")


# Get relevant object IDs
lending_market_registry=$(find_object_id "$SUILEND_RESPONSE" ".*::lending_market_registry::Registry")
registry=$(find_object_id "$STEAMM_RESPONSE" ".*::registry::Registry")

lp_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::lp_usdc_sui::LP_USDC_SUI>")
lp_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::lp_usdc_sui::LP_USDC_SUI>")

usdc_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::usdc::USDC>")
sui_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::sui::SUI>")
b_usdc_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::b_usdc::B_USDC>")
b_sui_metadata=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::CoinMetadata<.*::b_sui::B_SUI>")
b_usdc_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::b_usdc::B_USDC>")
b_sui_treasury_cap=$(find_object_id "$STEAMM_RESPONSE" "0x2::coin::TreasuryCap<.*::b_sui::B_SUI>")

echo "lending_market_registry: $lending_market_registry"
echo "registry: $registry"
echo "lp_metadata: $lp_metadata"
echo "lp_treasury_cap: $lp_treasury_cap"
echo "usdc_metadata: $usdc_metadata"
echo "sui_metadata: $sui_metadata"
echo "b_usdc_metadata: $b_usdc_metadata"
echo "b_sui_metadata: $b_sui_metadata"
echo "b_usdc_treasury_cap: $b_usdc_treasury_cap"
echo "b_sui_treasury_cap: $b_sui_treasury_cap"

PACKAGE_ID=$(echo "$STEAMM_RESPONSE" | grep -A 3 '"type": "published"' | grep "packageId" | cut -d'"' -f4)
echo "PACKAGE_ID: $PACKAGE_ID"

echo "$STEAMM_RESPONSE" > "result.json"


# Reset back to initial environment
if [ "$INITIAL_ENV" != "localnet" ]; then
    echo "Switching back to previous environment"
    sui client switch --env "$INITIAL_ENV"
fi

sui client call --package "$PACKAGE_ID" --module setup --function setup --args "$lending_market_registry" "$registry" "$lp_metadata" "$lp_treasury_cap" "$usdc_metadata" "$sui_metadata" "$b_usdc_metadata" "$b_sui_metadata" "$b_usdc_treasury_cap" "$b_sui_treasury_cap"