# steamm-fe/sdk

A TypeScript SDK for interacting with the STEAMM program published on npm as [`@suilend/steamm-sdk`](https://www.npmjs.com/package/@suilend/steamm-sdk).

### Beta actions

To initiate the SDK:

```ts
const sdk = new SteammSDK(BETA_CONFIG);

sdk.signer = keypair;
```

Use `STEAMM_BETA_CONFIG.packageId` for the beta package.

To fetch the pools:

```ts
const pools = await sdk.getPoolData();
```

Alternatively, one can fetch all pools for a dedicated pair:

```ts
// Note: type1 and type2 do not correspond to the token type's position in the pool
const pools = await sdk.getPoolData([coinType1, coinType2]);
```

To deposit liquidity:

```ts
await sdk.PoolManager.depositLiquidityEntry(tx, {
  pool: pools[0].poolId,
  coinTypeA: `${STEAMM_BETA_PKG_ID}::usdc::USDC`,
  coinTypeB: `${STEAMM_BETA_PKG_ID}::sui::SUI`,
  coinA: usdcCoin,
  coinB: suiCoin,
  maxA: BigInt("1000000000000000000"),
  maxB: BigInt("1000000000000000000"),
});
```

To perform a swap:

```ts
await sdk.Pool.swap(tx, {
  pool: pools[0].poolId,
  coinTypeA: `${STEAMM_BETA_PKG_ID}::usdc::USDC`,
  coinTypeB: `${STEAMM_BETA_PKG_ID}::sui::SUI`,
  coinA: usdcCoin,
  coinB: suiCoin,
  a2b: false,
  amountIn: BigInt("10000000000000"),
  minAmountOut: BigInt("0"),
});
```

And to redeem liquidity:

```ts
await sdk.PoolManager.redeemLiquidityEntry(tx, {
  pool: pools[0].poolId,
  coinTypeA: `${STEAMM_BETA_PKG_ID}::usdc::USDC`,
  coinTypeB: `${STEAMM_BETA_PKG_ID}::sui::SUI`,
  lpCoin: lpToken,
  minA: BigInt("0"),
  minB: BigInt("0"),
});
```

For quotations:

Deposit:

```ts
const quote = await sdk.PoolManager.quoteDeposit({
  pool: pools[0].poolId,
  maxA: BigInt("1000000000000000000"),
  maxB: BigInt("1000000000000000000"),
});
```

Redeem:

```ts
const quote = await sdk.PoolManager.quoteRedeem({
  pool: pools[0].poolId,
  lpTokens: BigInt("1000000000000000000"),
});
```

Swap:

```ts
const quote = await sdk.PoolManager.quoteSwap({
  pool: pools[0].poolId,
  a2b: false,
  amountIn: BigInt("10000000000000"),
});
```

---

Got a suggestion, running into issues, or have a question? Join our [#dev-support](https://discord.com/channels/1202984617087598622/1238023733403193385) channel on Discord.
