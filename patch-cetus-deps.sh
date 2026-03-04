#!/bin/bash
# Install nested @mysten/sui@1 deps for Cetus packages that are incompatible with v2
for pkg in node_modules/@cetusprotocol/cetus-sui-clmm-sdk node_modules/@cetusprotocol/aggregator-sdk; do
  if [ -d "$pkg" ] && [ ! -d "$pkg/node_modules/@mysten/sui" ]; then
    echo "Installing nested deps for $pkg..."
    (cd "$pkg" && npm install --legacy-peer-deps --ignore-scripts --no-audit --no-fund 2>/dev/null)
  fi
done
