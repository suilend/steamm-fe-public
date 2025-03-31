import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { PoolScriptFunctions } from "../../_codegen";
import { ToMultiSwapRouteArgs } from "../../_codegen/_generated/steamm_scripts/pool-script/functions";
import { BankInfo, PackageInfo, SteammPackageInfo } from "../../types";
import { Bank } from "../bank";

export class BankScript {
  public sourcePkgId: string;
  public publishedAt: string;
  public bankX: Bank;
  public bankY: Bank;

  constructor(
    steammPkgInfo: SteammPackageInfo,
    scriptPkgInfo: PackageInfo,
    bankInfoX: BankInfo,
    bankInfoY: BankInfo,
  ) {
    this.bankX = new Bank(steammPkgInfo, bankInfoX);
    this.bankY = new Bank(steammPkgInfo, bankInfoY);
    this.sourcePkgId = scriptPkgInfo.sourcePkgId;
    this.publishedAt = scriptPkgInfo.publishedAt;

    const [lendingMarketType, _coinTypeX, _bTokenXType] = this.bankX.typeArgs();
    const [_lendingMarketType, _coinTypeY, _bTokenYType] =
      this.bankX.typeArgs();

    if (lendingMarketType !== _lendingMarketType) {
      throw new Error(
        `Lending market mismatch: ${lendingMarketType} !== ${_lendingMarketType}`,
      );
    }
  }

  public toMultiSwapRoute(
    tx: Transaction,
    args: {
      x2y: boolean;
      amountIn: TransactionArgument;
      amountOut: TransactionArgument;
    },
  ) {
    const [lendingMarketType, coinTypeX, coinTypeY, bTokenXType, bTokenYType] =
      this.bankScriptTypes();

    const [bankXId, bankYId] = [
      this.bankX.bankInfo.bankId,
      this.bankY.bankInfo.bankId,
    ];

    const callArgs: ToMultiSwapRouteArgs = {
      bankX: tx.object(bankXId),
      bankY: tx.object(bankYId),
      lendingMarket: tx.object(this.bankX.bankInfo.lendingMarketId),
      x2Y: tx.pure.bool(args.x2y),
      amountIn: args.amountIn,
      amountOut: args.amountOut,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const quote = PoolScriptFunctions.toMultiSwapRoute(
      tx,
      [lendingMarketType, coinTypeX, coinTypeY, bTokenXType, bTokenYType],
      callArgs,
      this.publishedAt,
    );
    return quote;
  }

  public bankScriptTypes(): [string, string, string, string, string] {
    const [lendingMarketType, coinTypeX, bTokenXType] = this.bankX.typeArgs();
    const [_lendingMarketType, coinTypeY, bTokenYType] = this.bankY.typeArgs();

    return [lendingMarketType, coinTypeX, coinTypeY, bTokenXType, bTokenYType];
  }
}
