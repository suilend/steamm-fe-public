# steamm-fe/sdk

A TypeScript SDK for interacting with the Steamm program published on npm as [`@suilend/steamm-sdk`](https://www.npmjs.com/package/@suilend/steamm-sdk).

### Run localnet tests
`just start`

`just setup`

`bun test ./tests/index.test.ts`

### Testnet actions

Currently the protocol is only available on testnet. In order to bypass SUI faucet restrictions we deployed TEST coins with a dedicated faucet. To get coins for the purpose of interacting with the protocol:

```ts
const suiCoin = getTestSui(tx, 1000000000000000000);
const usdcCoin = getTestUsdc(tx, 1000000000000000000);
```

To initiate the sdk:

```ts
const sdk = new SteammSDK({
    fullRpcUrl: "https://fullnode.testnet.sui.io:443",
    steamm_config: {
      package_id: STEAMM_TESTNET_PKG_ID,
      published_at: STEAMM_TESTNET_PKG_ID,
    },
    suilend_config: {
      package_id: SUILEND_TESTNET_PKG_ID,
      published_at: SUILEND_TESTNET_PKG_ID,
    },
});
```

To fetch the pools:

```ts
const pools = await sdk.getPools();
```

Alternatively one can fetch all the pools for a dedicated pair:

```ts
// Note: type1 nd type2 do not correspond to the token type's position in the pool
const pools = await sdk.getPoolsByType(coinType1, coinType2);
```

To deposit liquidity:

```ts
await sdk.Pool.depositLiquidityEntry(
    {
      pool: pools[0].poolId,
      coinTypeA: `${STEAMM_TESTNET_PKG_ID}::usdc::USDC`,
      coinTypeB: `${STEAMM_TESTNET_PKG_ID}::sui::SUI`,
      coinObjA: usdcCoin,
      coinObjB: suiCoin,
      maxA: BigInt("1000000000000000000"),
      maxB: BigInt("1000000000000000000"),
    },
    tx
);
```

To perform a swap:
```ts
await sdk.Pool.swapEntry(
    {
      pool: pools[0].poolId,
      coinTypeA: `${STEAMM_TESTNET_PKG_ID}::usdc::USDC`,
      coinTypeB: `${STEAMM_TESTNET_PKG_ID}::sui::SUI`,
      coinAObj: usdcCoin,
      coinBObj: suiCoin,
      a2b: false,
      amountIn: BigInt("10000000000000"),
      minAmountOut: BigInt("0"),
    },
    tx
);
```

And to redeem liquidity:

```ts
await sdk.Pool.redeemLiquidityEntry(
    {
      pool: pools[0].poolId,
      coinTypeA: `${STEAMM_TESTNET_PKG_ID}::usdc::USDC`,
      coinTypeB: `${STEAMM_TESTNET_PKG_ID}::sui::SUI`,
      lpCoinObj: lpToken,
      minA: BigInt("0"),
      minB: BigInt("0"),
    },
    tx
);
```


---

Got a suggestion, running into issues, or have a question? Join our [#dev-support](https://discord.com/channels/1202984617087598622/1238023733403193385) channel on Discord.


---