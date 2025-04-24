import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";

import { PoolFunctions, QuoteFunctions } from "../_codegen";
import { Bank, BankScript } from "../base";
import { MultiSwapQuote, castMultiSwapQuote } from "../base/pool/poolTypes";
import { OracleSwapExtraArgs } from "../base/quoters/oracleQuoter/args";
import { OracleV2SwapExtraArgs } from "../base/quoters/oracleV2Quoter/args";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import {
  BankInfo,
  BankList,
  getBankFromBToken,
  getBankFromUnderlying,
  getQuoterType,
} from "../types";
import { zip } from "../utils";

import { getOracleArgs, getOracleV2Args } from "./poolModule";

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
    const bankList = await this.sdk.getBanks();
    const pools = await this.sdk.getPools();

    const [btokens, bankInfos] = this.mintBTokens(
      tx,
      bankList,
      args.route,
      args.coinIn,
      args.quote.amountIn,
    );

    const swapResults = [];
    let i = 0;

    for (const hop of args.route) {
      const poolInfo = pools.find((pool) => pool.poolId === hop.poolId)!;

      const pool = this.sdk.getPool(poolInfo);

      const coinAIndex = bankInfos.findIndex(
        (bankInfo) => bankInfo.btokenType === poolInfo.coinTypeA,
      );
      const coinBIndex = bankInfos.findIndex(
        (bankInfo) => bankInfo.btokenType === poolInfo.coinTypeB,
      );

      const bankA = new Bank(this.sdk.packageInfo(), bankInfos[coinAIndex]);
      const bankB = new Bank(this.sdk.packageInfo(), bankInfos[coinBIndex]);
      const coinA = btokens[coinAIndex];
      const coinB = btokens[coinBIndex];

      const amountIn =
        i === 0
          ? hop.a2b
            ? this.sdk.fullClient.coinValue(tx, coinA, poolInfo.coinTypeA)
            : this.sdk.fullClient.coinValue(tx, coinB, poolInfo.coinTypeB)
          : PoolFunctions.swapResultAmountOut(
              tx,
              swapResults[i - 1],
              this.sdk.sdkOptions.steamm_config.published_at,
            );
      // const minAmountOut = BigInt(0);
      const minAmountOut =
        i === args.route.length - 1
          ? (() => {
              if (hop.a2b) {
                return bankB.toBTokens(tx, { amount: args.quote.amountOut });
              } else {
                return bankA.toBTokens(tx, { amount: args.quote.amountOut });
              }
            })()
          : BigInt(0);

      const quoterType = getQuoterType(poolInfo.quoterType);
      const extraArgs:
        | OracleSwapExtraArgs
        | OracleV2SwapExtraArgs
        | { type: "ConstantProduct" } =
        quoterType === "Oracle"
          ? await getOracleArgs(this.sdk, tx, poolInfo)
          : quoterType === "OracleV2"
            ? await getOracleV2Args(this.sdk, tx, poolInfo)
            : { type: "ConstantProduct" };

      const swapResult = pool.swap(tx, {
        coinA,
        coinB,
        a2b: hop.a2b,
        amountIn,
        minAmountOut,
        ...extraArgs,
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

    for (const route of routes) {
      await this.quoteSwapRoute(
        tx,
        coinPair.coinIn,
        coinPair.coinOut,
        route,
        amountIn,
      );
    }

    const quotesRaw = await this.getQuoteResults<MultiSwapQuote>(
      tx,
      "MultiRouteSwapQuote",
    );

    if (quotesRaw.length === 0) {
      throw new Error("No quotes found for the given coin pair");
    }

    const quotes = quotesRaw.map((quote) => castMultiSwapQuote(quote));

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
  ) {
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
      const poolInfo = pools.find((pool) => pool.poolId === hop.poolId)!;

      const bankInfoA = getBankFromBToken(bankList, hop.coinTypeA);
      const bankInfoB = getBankFromBToken(bankList, hop.coinTypeB);

      const poolScript = this.sdk.getPoolScript(poolInfo, bankInfoA, bankInfoB);

      const quoterType = getQuoterType(poolInfo.quoterType);
      const extraArgs:
        | OracleSwapExtraArgs
        | OracleV2SwapExtraArgs
        | { type: "ConstantProduct" } =
        quoterType === "Oracle"
          ? await getOracleArgs(this.sdk, tx, poolInfo)
          : quoterType === "OracleV2"
            ? await getOracleV2Args(this.sdk, tx, poolInfo)
            : { type: "ConstantProduct" };

      const args = {
        a2b: hop.a2b,
        amountIn: nextBTokenAmountIn,
      };

      const quote = poolScript.quoteSwap(tx, { ...args, ...extraArgs });

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
  }

  private async getQuoteResults<T>(
    tx: Transaction,
    quoteType: string,
  ): Promise<T[]> {
    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
        additionalArgs: { showRawTxnDataAndEffects: true },
      },
    );

    if (inspectResults.error) {
      console.log("Error:", inspectResults.error);
      console.log(tx.getData());
      console.log("Failed to fetch quotes");
      return [];
    }

    const quoteEvents = inspectResults.events.filter((event) =>
      event.type.includes(quoteType),
    );

    if (quoteEvents.length === 0) {
      throw new Error(`No quote events of type ${quoteType} found in events`);
    }

    return quoteEvents.map((event) => (event.parsedJson as any).event as T);
  }

  private async getQuoteResult<T>(
    tx: Transaction,
    quoteType: string,
  ): Promise<T | null> {
    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
        additionalArgs: { showRawTxnDataAndEffects: true },
      },
    );

    if (inspectResults.error) {
      console.log("Failed to fetch quote");
      // console.log(JSON.stringify(tx.getData()));
      return null;
    }

    const quoteEvent = inspectResults.events.find((event) =>
      event.type.includes(quoteType),
    );

    if (!quoteEvent) {
      throw new Error(`Quote event of type ${quoteType} not found in events`);
    }

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

  public mintBTokens(
    tx: Transaction,
    banks: BankList,
    route: Route,
    coinIn: TransactionObjectInput,
    amountIn: bigint,
  ): [TransactionResult[], BankInfo[]] {
    const bankData: BankInfo[] = Object.values(banks);
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
      // TOODO: revisit
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
