#
# `$ just sdk`
#

# By default just list all available commands
[private]
default:
    @just -l sdk

# Fails if sui is not a binary
[private]
_check_sui:
    #!/bin/bash
    if ! command -v sui 2>&1 >/dev/null
    then
        echo "sui binary not found"
        echo "You can download the binary from https://github.com/MystenLabs/sui/releases"
        exit 1
    fi


# Regenerates the smart contract bindings
bind:
    rm -rf src/_codegen/_generated/_dependencies/*
    rm -rf src/_codegen/_generated/_framework/*
    rm -rf src/_codegen/_generated/slamm/*
    rm -rf src/_codegen/_generated/.eslintrc.json

    sui-client-gen --manifest src/_codegen/_generated --out src/_codegen/_generated

# Resets localnet state and starts the network
localnew: _check_sui
    sui genesis -f
    sui start

# Starts the localnet network
local: _check_sui
    sui start

# Publishes packages to localnet and runs ts tests
setup:
    bash -c 'cd ../ && ./bin/publocal.sh'
unset:
    bash -c 'cd ../ && ./bin/unpublocal.sh'

test:
    bash -c 'cd ../ && ./bin/publocal.sh'
    bun test
    bash -c 'cd ../ && ./bin/unpublocal.sh'

