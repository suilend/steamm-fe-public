import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";

import {
  PoolFunctions,
  PoolScriptFunctions,
  QuoteFunctions,
} from "../_codegen";
import { Bank, BankScript, PoolScript, SwapQuote } from "../base";
import { MultiSwapQuote, castMultiSwapQuote } from "../base/pool/poolTypes";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { BankInfo, BankList, PoolInfo } from "../types";

import { SwapArgs } from "./poolModule";

export interface CoinPair {
  coinIn: string;
  coinOut: string;
}

export type PoolData = {
  poolId: string;
  coinTypeA: string;
  coinTypeB: string;
};

export type HopData = PoolData & { a2b: boolean };
export type Route = HopData[];
export type Routes = Route[];

/**
 * Helper class to help interact with pools.
 */
export class RouterModule implements IModule {
  protected _sdk: SteammSDK;

  constructor(sdk: SteammSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public async swapRoute(
    tx: Transaction,
    args: { swapArgs: SwapArgs; route: Route; quote: MultiSwapQuote },
  ) {
    const bankList = await this.sdk.getBanks();
    const pools = await this.sdk.getPools();

    const coinIn: TransactionObjectInput = args.swapArgs.a2b
      ? args.swapArgs.coinA
      : args.swapArgs.coinB;

    const [btokens, bankInfos] = this.mintBTokens(
      tx,
      bankList,
      args.route,
      coinIn,
      args.quote.amountIn,
    );

    const swapResults = [];
    let i = 0;

    for (const hop of args.route) {
      const poolInfo = pools.find((pool) => pool.poolId === hop.poolId)!;
      const bankInfoA = bankList[hop.coinTypeA];
      const bankInfoB = bankList[hop.coinTypeB];

      const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

      // if first
      const coinA = hop.a2b ? btokens[i] : btokens[i + 1];
      const coinB = hop.a2b ? btokens[i + 1] : btokens[i];

      const amountIn =
        i === 0
          ? args.quote.amountIn
          : PoolFunctions.swapResultAmountOut(
              tx,
              swapResults[i - 1],
              this.sdk.sdkOptions.steamm_config.published_at,
            );
      const minAmountOut =
        i === args.route.length - 1 ? args.quote.amountOut : BigInt(0); // TODO: add some slippage param for the last swap

      const swapResult = poolScript.swap(tx, {
        coinA,
        coinB,
        a2b: hop.a2b,
        amountIn,
        minAmountOut,
      });

      swapResults.push(swapResult);

      i += 1;
    }

    this.collectBTokenDust(tx, bankInfos[0], btokens[0]);
    this.collectBTokenDust(
      tx,
      bankInfos[bankInfos.length - 1],
      btokens[btokens.length - 1],
    );

    for (const [btoken, bankInfo] of zip(btokens, bankInfos)) {
      this.destroyOrTransfer(tx, bankInfo.btokenType, btoken);
    }
  }

  public async findSwapRoutes(coinPair: CoinPair): Promise<Routes> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const bTokenIn = bankList[coinPair.coinIn].btokenType;
    const bTokenOut = bankList[coinPair.coinOut].btokenType;

    return findAllRoutes(bTokenIn, bTokenOut, pools);
  }

  public async getBestSwapRoute(
    coinPair: CoinPair,
    args: SwapArgs,
  ): Promise<{ route: Route; quote: MultiSwapQuote }> {
    const tx = new Transaction();
    const routes = await this.findSwapRoutes(coinPair);

    // TODO: programmable tx is better
    const quotes = [];
    for (const route of routes) {
      const quote = await this.quoteSwapRoute(
        tx,
        coinPair.coinIn,
        coinPair.coinOut,
        route,
        args,
      );
      quotes.push(quote);
    }

    // Find the best quote (highest amount out)
    let bestQuoteIndex = 0;
    let maxAmountOut = BigInt(0);

    quotes.forEach((quote, index) => {
      if (quote.amountOut > maxAmountOut) {
        maxAmountOut = quote.amountOut;
        bestQuoteIndex = index;
      }
    });

    // Return the route with the best quote
    return { route: routes[bestQuoteIndex], quote: quotes[bestQuoteIndex] };
  }

  public async quoteSwapRoute(
    tx: Transaction,
    coinTypeIn: string,
    coinTypeOut: string,
    route: Route,
    args: SwapArgs,
  ): Promise<MultiSwapQuote> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const bankInfoX = bankList[coinTypeIn];
    const bankInfoY = bankList[coinTypeOut];

    const bankX = new Bank(this.sdk.packageInfo(), bankInfoX);
    const bankY = new Bank(this.sdk.packageInfo(), bankInfoY);

    const firstBTokenAmountIn = this.getBTokenAmountInForQuote(
      tx,
      bankX,
      bankY,
      route[0].a2b, // first hop direction
      args.amountIn,
    );

    let nextBTokenAmountIn = firstBTokenAmountIn;

    for (const hop of route) {
      const poolInfo = pools.find((pool) => pool.poolId === hop.poolId)!;
      const bankInfoA = bankList[hop.coinTypeA];
      const bankInfoB = bankList[hop.coinTypeB];

      const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

      const quote = poolScript.quoteSwap(tx, {
        a2b: hop.a2b,
        amountIn: nextBTokenAmountIn,
      });

      nextBTokenAmountIn = QuoteFunctions.amountOut(
        tx,
        quote,
        this.sdk.sdkOptions.steamm_config.published_at,
      );
    }

    const bankScript = this.getBankScript(bankInfoX, bankInfoY);

    const multiSwapQuote = bankScript.toMultiSwapRoute(tx, {
      x2y: true, // it's always true
      amountIn: firstBTokenAmountIn,
      amountOut: nextBTokenAmountIn,
    });

    // TODO: fix script package ID
    return castMultiSwapQuote(
      await this.getQuoteResult<SwapQuote>(
        tx,
        multiSwapQuote,
        "MultiSwapQuote",
      ),
    );
  }

  private async getQuoteResult<T>(
    tx: Transaction,
    quote: TransactionArgument,
    quoteType: string,
  ): Promise<T> {
    const pkgAddy = this.sdk.sdkOptions.steamm_config.package_id;

    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
      },
    );

    // console.log(inspectResults)
    if (inspectResults.error) {
      throw new Error("DevInspect Failed");
    }

    const quoteResult = (inspectResults.events[0].parsedJson as any).event as T;
    return quoteResult;
  }

  private getBankScript(bankInfoA: BankInfo, bankInfoB: BankInfo): BankScript {
    return new BankScript(
      this.sdk.sdkOptions.steamm_config.package_id,
      bankInfoA,
      bankInfoB,
    );
  }

  public mintBTokens(
    tx: Transaction,
    banks: BankList,
    route: Route,
    coinIn: TransactionObjectInput,
    amountIn: bigint,
  ): [TransactionObjectInput[], BankInfo[]] {
    const bankData: BankInfo[] = Object.values(banks);
    const coinTypes: string[] = [];
    const bTokens: TransactionObjectInput[] = [];
    const bankDataToReturn: TransactionObjectInput[] = [];

    for (const hop of route) {
      if (coinTypes.length === 0) {
        coinTypes.push(hop.coinTypeA);
        coinTypes.push(hop.coinTypeB);
      } else {
        coinTypes.push(hop.coinTypeB);
      }
    }

    let i = 0;
    for (const coinType of coinTypes) {
      const bankInfo =
        bankData.find((bank) => bank.btokenType === coinType) ??
        (() => {
          throw new Error(`Bank info not found for bTokenType ${coinType}`);
        })();

      const bToken =
        i === 0
          ? (() => {
              const bank = new Bank(this.sdk.packageInfo(), bankInfo);

              return bank.mintBTokens(tx, {
                coin: coinIn,
                coinAmount: amountIn,
              });
            })()
          : this.sdk.fullClient.zeroCoin(tx, coinType);

      bankDataToReturn.push(bankInfo);
      bTokens.push(bToken);
      i += 1;
    }

    return [bTokens, bankDataToReturn];
  }

  public collectBTokenDust(
    tx: Transaction,
    bankInfo: BankInfo,
    bToken: TransactionObjectInput,
  ) {
    const bankIn = new Bank(this.sdk.packageInfo(), bankInfo);

    const amountIn: TransactionResult = this.sdk.fullClient.coinValue(
      tx,
      tx.object(bToken),
      bankInfo.btokenType,
    );

    bankIn.burnBTokens(tx, { btokens: bToken, btokenAmount: amountIn });
  }

  public destroyOrTransfer(
    tx: Transaction,
    btokenType: string,
    btoken: TransactionObjectInput,
  ): TransactionArgument {
    const quote = PoolScriptFunctions.destroyOrTransfer(
      tx,
      btokenType,
      { btoken },
      this.sdk.sdkOptions.steamm_config.package_id,
    );
    return quote;
  }

  public getBTokenAmountInForQuote(
    tx: Transaction,
    bankX: Bank,
    bankY: Bank,
    x2y: boolean,
    amountIn: bigint | TransactionArgument,
  ): TransactionArgument {
    bankX.compoundInterestIfAny(tx);
    bankY.compoundInterestIfAny(tx);

    const bTokensIn = x2y
      ? bankX.toBTokens(tx, { amount: amountIn })
      : bankY.toBTokens(tx, { amount: amountIn });

    return bTokensIn;
  }
}

export function findAllRoutes(
  start: string,
  end: string,
  pools: PoolData[],
): HopData[][] {
  const adjacencyList = new Map<string, PoolData[]>();

  // Build adjacency list
  pools.forEach((pool) => {
    if (!adjacencyList.has(pool.coinTypeA))
      adjacencyList.set(pool.coinTypeA, []);
    if (!adjacencyList.has(pool.coinTypeB))
      adjacencyList.set(pool.coinTypeB, []);
    adjacencyList.get(pool.coinTypeA)!.push(pool);
    adjacencyList.get(pool.coinTypeB)!.push(pool);
  });

  const results: HopData[][] = [];
  const visitedTokens = new Set<string>();

  function dfs(current: string, path: HopData[]) {
    if (current === end) {
      results.push([...path]);
      return;
    }

    visitedTokens.add(current);

    for (const pool of adjacencyList.get(current) || []) {
      const nextToken =
        pool.coinTypeA === current ? pool.coinTypeB : pool.coinTypeA;
      if (!visitedTokens.has(nextToken)) {
        const hop: HopData = { ...pool, a2b: pool.coinTypeA === current };
        path.push(hop);
        dfs(nextToken, path);
        path.pop();
      }
    }

    visitedTokens.delete(current);
  }

  dfs(start, []);
  return results;
}

function zip<T, U>(a: T[], b: U[]): [T, U][] {
  return a.map((k, i) => [k, b[i]]);
}
