# Parse command line arguments
CI=false

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --ci) CI=true ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ "$CI" = false ]; then
    # Remove temp directory and all its contents recursively if it exists
    rm -rf temp
fi


# Get content from packages.ts and replace current content
cat > tests/packages.ts << 'EOL'
// These addresses are filled automatically by the test pipeline
// These addresses are filled automatically by the test pipeline
export const LIQUID_STAKING_PKG_ID = "";
export const WORMHOLE_PKG_ID = "";
export const SPRUNGSUI_PKG_ID = "";
export const PYTH_PKG_ID = "";
export const SWITCHBOARD_PKG_ID = "";
export const ORACLES_PKG_ID = "";
export const SUILEND_PKG_ID = "";
export const STEAMM_PKG_ID = "";
export const STEAMM_SCRIPT_PKG_ID = "";
export const REGISTRY_ID = "";
export const GLOBAL_ADMIN_ID = "";
export const LENDING_MARKET_ID = "";
export const LENDING_MARKET_TYPE = "";
export const ORACLE_REGISTRY_ID = "";
export const ORACLE_ADMIN_CAP_ID = "";

EOL
