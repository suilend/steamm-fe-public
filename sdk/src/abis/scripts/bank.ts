import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { Codegen } from "../..";
import { ToMultiSwapRouteArgs } from "../../_codegen/_generated/steamm_scripts/pool-script/functions";
import { BankInfo, PackageInfo, SteammInfo } from "../../types";
import { BankAbi } from "../bank";

export class BankScript {
  public scriptInfo: PackageInfo;
  public bankX: BankAbi;
  public bankY: BankAbi;

  constructor(
    steammInfo: SteammInfo,
    scriptInfo: PackageInfo,
    bankInfoX: BankInfo,
    bankInfoY: BankInfo,
  ) {
    this.bankX = new BankAbi(steammInfo, bankInfoX);
    this.bankY = new BankAbi(steammInfo, bankInfoY);
    this.scriptInfo = scriptInfo;

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

    const quote = Codegen.PoolScriptV1.toMultiSwapRoute(
      tx,
      [lendingMarketType, coinTypeX, coinTypeY, bTokenXType, bTokenYType],
      callArgs,
      this.scriptInfo.publishedAt,
    );
    return quote;
  }

  public bankScriptTypes(): [string, string, string, string, string] {
    const [lendingMarketType, coinTypeX, bTokenXType] = this.bankX.typeArgs();
    const [_lendingMarketType, coinTypeY, bTokenYType] = this.bankY.typeArgs();

    return [lendingMarketType, coinTypeX, coinTypeY, bTokenXType, bTokenYType];
  }
}
