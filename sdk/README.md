# steamm-fe/sdk

A TypeScript SDK for interacting with the STEAMM program published on npm as [`@suilend/steamm-sdk`](https://www.npmjs.com/package/@suilend/steamm-sdk).

### Mainnet actions

To initiate the sdk:

```ts
import { MAINNET_CONFIG, SteammSDK } from "@suilend/steamm-sdk";

const sdk = new SteammSDK(MAINNET_CONFIG);

sdk.signer = keypair;
```

To fetch the pools:

```ts
const pools = await sdk.fetchPoolData();
```

Alternatively, one can fetch all pools for a dedicated pair:

```ts
// Note: type1 and type2 do not correspond to the token type's position in the pool
const pools = await sdk.fetchPoolData([coinType1, coinType2]);
```

To deposit liquidity:

```ts
await sdk.Pool.depositLiquidityEntry(tx, {
  pool: pools[0].poolId,
  coinTypeA,
  coinTypeB,
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
  coinTypeA,
  coinTypeB,
  coinA: usdcCoin,
  coinB: suiCoin,
  a2b: false,
  amountIn: BigInt("10000000000000"),
  minAmountOut: BigInt("0"),
});
```

And to redeem liquidity:

```ts
await sdk.Pool.redeemLiquidityEntry(
  {
    pool: pools[0].poolId,
    coinTypeA,
    coinTypeB,
    lpCoin: lpToken,
    minA: BigInt("0"),
    minB: BigInt("0"),
  },
  tx,
);
```

For quotations:

Deposit:

```ts
const quote = await sdk.Pool.quoteDeposit({
  pool: pools[0].poolId,
  maxA: BigInt("1000000000000000000"),
  maxB: BigInt("1000000000000000000"),
});
```

Redeem:

```ts
const quote = await sdk.Pool.quoteRedeem({
  pool: pools[0].poolId,
  lpTokens: BigInt("1000000000000000000"),
});
```

Swap:

```ts
const quote = await sdk.Pool.quoteSwap({
  pool: pools[0].poolId,
  a2b: false,
  amountIn: BigInt("10000000000000"),
});
```

---

Got a suggestion, running into issues, or have a question? Join our [#dev-support](https://discord.com/channels/1202984617087598622/1238023733403193385) channel on Discord.

---
