# Remove temp directory and all its contents recursively if it exists
rm -rf temp

# Get content from packages.ts and replace current content
cat > sdk/tests/packages.ts << 'EOL'
// These addresses are filled automatically by the test pipeline
export const LIQUID_STAKING_PKG_ID = "";
export const WORMHOLE_PKG_ID = "";
export const SPRUNGSUI_PKG_ID = "";
export const PYTH_PKG_ID = "";
export const SUILEND_PKG_ID = "";
export const STEAMM_PKG_ID = "";
EOL
