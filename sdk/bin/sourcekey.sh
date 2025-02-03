#!/bin/bash
trap 'echo "Error at line $LINENO: $(caller) -> Command [$BASH_COMMAND] failed with exit code $?" >&2; exit 1' ERR
set -eE

# Export temporary private key to env - needed for tests
ACTIVE_ADDRESS=$(sui client --client.config sui/client.yaml addresses --json | jq -r '.activeAddress')
echo "Active address: $ACTIVE_ADDRESS"
PRIVATE_KEY=$(sui keytool --keystore-path sui/sui.keystore export --key-identity $ACTIVE_ADDRESS --json | jq -r '.exportedPrivateKey')
printf "\nPRIVATE_KEY=\"%s\"\n" $PRIVATE_KEY >> .env