import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";

import { PoolFunctions, QuoteFunctions } from "../_codegen";
import { Bank, BankScript } from "../base";
import { MultiSwapQuote, castMultiSwapQuote } from "../base/pool/poolTypes";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { BankInfo } from "../types";
import {
  getBankFromBToken,
  getBankFromUnderlying,
  getPoolInfo,
} from "../utils";

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

  public async swapWithRoute(
    tx: Transaction,
    args: {
      coinIn: TransactionObjectInput;
      route: Route;
      quote: MultiSwapQuote;
    },
  ) {
    const pools = await this.sdk.getPools();

    const [btokens, bankInfos] = await this.mintBTokens(
      tx,
      args.route,
      args.coinIn,
      args.quote.amountIn,
    );

    const swapResults = [];
    let i = 0;

    for (const hop of args.route) {
      const poolInfo = getPoolInfo(pools, hop.poolId);

      const pool = this.sdk.getPool(poolInfo);

      const coinAIndex = bankInfos.findIndex(
        (bankInfo) => bankInfo.btokenType === poolInfo.coinTypeA,
      );
      const coinBIndex = bankInfos.findIndex(
        (bankInfo) => bankInfo.btokenType === poolInfo.coinTypeB,
      );

      const coinA = btokens[coinAIndex];
      const coinB = btokens[coinBIndex];

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

      const swapResult = pool.swap(tx, {
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

    const bTokenIn = getBankFromUnderlying(
      bankList,
      coinPair.coinIn,
    ).btokenType;
    const bTokenOut = getBankFromUnderlying(
      bankList,
      coinPair.coinOut,
    ).btokenType;

    return findAllRoutes(bTokenIn, bTokenOut, pools);
  }

  public async getBestSwapRoute(
    coinPair: CoinPair,
    amountIn: bigint,
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
        amountIn,
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
    amountIn: bigint,
  ): Promise<MultiSwapQuote> {
    const pools = await this.sdk.getPools();
    const bankList = await this.sdk.getBanks();

    const bankInfoX = getBankFromUnderlying(bankList, coinTypeIn);
    const bankInfoY = getBankFromUnderlying(bankList, coinTypeOut);

    const bankX = new Bank(this.sdk.packageInfo(), bankInfoX);
    const bankY = new Bank(this.sdk.packageInfo(), bankInfoY);

    const firstBTokenAmountIn = this.getBTokenAmountInForQuote(
      tx,
      bankX,
      bankY,
      route[0].a2b, // first hop direction
      amountIn,
    );

    let nextBTokenAmountIn: TransactionResult = firstBTokenAmountIn;

    for (const hop of route) {
      const poolInfo = getPoolInfo(pools, hop.poolId);

      const bankInfoA = getBankFromBToken(bankList, hop.coinTypeA);
      const bankInfoB = getBankFromBToken(bankList, hop.coinTypeB);

      const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

      const quote = poolScript.quoteSwap(tx, {
        a2b: hop.a2b,
        amountIn: nextBTokenAmountIn,
      });

      const amountOut = QuoteFunctions.amountOut(
        tx,
        quote,
        this.sdk.sdkOptions.steamm_config.published_at,
      );

      nextBTokenAmountIn = amountOut;
    }

    const bankScript = this.getBankScript(bankInfoX, bankInfoY);

    bankScript.toMultiSwapRoute(tx, {
      x2y: true, // it's always true
      amountIn: firstBTokenAmountIn,
      amountOut: nextBTokenAmountIn,
    });

    return castMultiSwapQuote(
      await this.getQuoteResult<MultiSwapQuote>(tx, "MultiRouteSwapQuote"),
    );
  }

  private async getQuoteResult<T>(
    tx: Transaction,
    quoteType: string,
  ): Promise<T> {
    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
        additionalArgs: { showRawTxnDataAndEffects: true },
      },
    );

    if (inspectResults.error) {
      console.log(inspectResults);
      // console.log(JSON.stringify(tx.getData()));
      throw new Error("DevInspect Failed");
    }

    const quoteEvent = inspectResults.events.find((event) =>
      event.type.includes(quoteType),
    );

    if (!quoteEvent) {
      throw new Error(`Quote event of type ${quoteType} not found in events`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteResult = (quoteEvent.parsedJson as any).event as T;
    return quoteResult;
  }

  private getBankScript(bankInfoA: BankInfo, bankInfoB: BankInfo): BankScript {
    return new BankScript(
      this.sdk.packageInfo(),
      this.sdk.scriptPackageInfo(),
      bankInfoA,
      bankInfoB,
    );
  }

  public async mintBTokens(
    tx: Transaction,
    route: Route,
    coinIn: TransactionObjectInput,
    amountIn: bigint,
  ): Promise<[TransactionResult[], BankInfo[]]> {
    const coinTypes: string[] = [];
    const bTokens: TransactionResult[] = [];
    const bankDataToReturn: BankInfo[] = [];

    for (const hop of route) {
      if (coinTypes.length === 0) {
        if (hop.a2b) {
          coinTypes.push(hop.coinTypeA);
          coinTypes.push(hop.coinTypeB);
        } else {
          coinTypes.push(hop.coinTypeB);
          coinTypes.push(hop.coinTypeA);
        }
      } else {
        if (!coinTypes.includes(hop.coinTypeA)) {
          coinTypes.push(hop.coinTypeA);
        }
        if (!coinTypes.includes(hop.coinTypeB)) {
          coinTypes.push(hop.coinTypeB);
        }
      }
    }

    let i = 0;
    for (const coinType of coinTypes) {
      const bankInfo = getBankFromBToken(await this.sdk.getBanks(), coinType);

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

    const amount: TransactionResult = this.sdk.fullClient.coinValue(
      tx,
      tx.object(bToken),
      bankInfo.btokenType,
    );

    const coin = bankIn.burnBTokens(tx, {
      btokens: bToken,
      btokenAmount: amount,
    });

    // TODO: Merge this with the main coin - when it is coinIn, when its coinOut transfer
    tx.transferObjects([coin], this.sdk.senderAddress);
  }

  public destroyOrTransfer(
    tx: Transaction,
    btokenType: string,
    btoken: TransactionResult,
  ) {
    return tx.moveCall({
      target: `${this.sdk.scriptPackageInfo().publishedAt}::pool_script::destroy_or_transfer`,
      typeArguments: [btokenType],
      arguments: [btoken],
    });
  }

  public getBTokenAmountInForQuote(
    tx: Transaction,
    bankX: Bank,
    bankY: Bank,
    x2y: boolean,
    amountIn: bigint | TransactionArgument,
  ): TransactionResult {
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
