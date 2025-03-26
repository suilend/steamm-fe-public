import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { BankFunctions } from "../..";
import { BankInfo, PackageInfo, SteammPackageInfo } from "../../types";

import {
  BurnBTokensArgs,
  CTokenAmountArgs,
  CreateBankArgs,
  InitLendingArgs,
  MigrateBankArgs,
  MintBTokensArgs,
  SetBankUtilisationBpsArgs,
  SetMinTokenBlockSizeArgs,
} from "./bankArgs";

export * from "./bankArgs";
export * from "./bankMath";

export class Bank {
  public sourcePkgId: string;
  public publishedAt: string;
  public bankInfo: BankInfo;

  constructor(pkgInfo: SteammPackageInfo, bankInfo: BankInfo) {
    this.bankInfo = bankInfo;
    this.sourcePkgId = pkgInfo.sourcePkgId;
    this.publishedAt = pkgInfo.publishedAt;
  }

  public mintBTokens(
    tx: Transaction,
    args: MintBTokensArgs,
  ): TransactionResult {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      coinT: args.coin,
      coinAmount: args.coinAmount,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const bToken = BankFunctions.mintBtoken(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
    return bToken;
  }

  public burnBTokens(
    tx: Transaction,
    args: BurnBTokensArgs,
  ): TransactionResult {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      btokens: args.btokens,
      btokenAmount: args.btokenAmount,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const coin = BankFunctions.burnBtoken(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
    return coin;
  }

  public initLending(tx: Transaction, args: InitLendingArgs) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      globalAdmin: args.globalAdmin,
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      targetUtilisationBps: args.targetUtilisationBps,
      utilisationBufferBps: args.utilisationBufferBps,
    };

    BankFunctions.initLending(tx, this.typeArgs(), callArgs, this.publishedAt);
  }

  public rebalance(tx: Transaction) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    BankFunctions.rebalance(tx, this.typeArgs(), callArgs, this.publishedAt);
  }

  public compoundInterestIfAny(tx: Transaction) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    BankFunctions.compoundInterestIfAny(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public toBTokens(
    tx: Transaction,
    args: { amount: bigint | TransactionArgument },
  ): TransactionResult {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
      amount: args.amount,
    };

    return BankFunctions.toBtokens(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public fromBtokens(
    tx: Transaction,
    args: { btokenAmount: bigint | TransactionArgument },
  ): TransactionResult {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      btokenAmount: args.btokenAmount,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    return BankFunctions.fromBtokens(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public cTokenAmount(
    tx: Transaction,
    args: CTokenAmountArgs,
  ): TransactionArgument {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      amount: args.amount,
    };

    return BankFunctions.ctokenAmount(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public setUtilisationBps(tx: Transaction, args: SetBankUtilisationBpsArgs) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      globalAdmin: args.globalAdmin,
      targetUtilisationBps: args.targetUtilisationBps,
      utilisationBufferBps: args.utilisationBufferBps,
    };

    BankFunctions.setUtilisationBps(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public setMinimumTokenBlockSize(
    tx: Transaction,
    args: SetMinTokenBlockSizeArgs,
  ) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      globalAdmin: args.globalAdmin,
      minTokenBlockSize: args.minTokenBlockSize,
    };

    BankFunctions.setMinTokenBlockSize(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public bank(tx: Transaction): TransactionObjectInput {
    return tx.object(this.bankInfo.bankId);
  }

  public lendingMarket(tx: Transaction): TransactionObjectInput {
    return tx.object(this.bankInfo.lendingMarketId);
  }

  public migrate(tx: Transaction, args: MigrateBankArgs) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      admin: args.admin,
    };

    BankFunctions.migrate(tx, this.typeArgs(), callArgs);
  }

  // Client-side logic

  public needsRebalance(tx: Transaction): TransactionArgument {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    return BankFunctions.needsRebalance(tx, this.typeArgs(), callArgs);
  }

  // Getters

  public viewLending(tx: Transaction): TransactionArgument {
    return BankFunctions.lending(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewTotalFunds(tx: Transaction): TransactionArgument {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    return BankFunctions.totalFunds(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public viewFundsAvailable(tx: Transaction): TransactionArgument {
    return BankFunctions.fundsAvailable(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewTargetUtilisationBps(tx: Transaction): TransactionArgument {
    return BankFunctions.targetUtilisationBps(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewUtilisationBufferBps(tx: Transaction): TransactionArgument {
    return BankFunctions.utilisationBufferBps(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewTargetUtilisationBpsUnchecked(
    tx: Transaction,
  ): TransactionArgument {
    return BankFunctions.targetUtilisationBpsUnchecked(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewUtilisationBufferBpsUnchecked(
    tx: Transaction,
  ): TransactionArgument {
    return BankFunctions.utilisationBufferBpsUnchecked(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewReserveArrayIndex(tx: Transaction): TransactionArgument {
    return BankFunctions.reserveArrayIndex(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }
  public typeArgs(): [string, string, string] {
    return [
      this.bankInfo.lendingMarketType,
      this.bankInfo.coinType,
      this.bankInfo.btokenType,
    ];
  }
}

export function createBank(
  tx: Transaction,
  args: CreateBankArgs,
  pkgInfo: PackageInfo,
): TransactionArgument {
  const { lendingMarketType, coinType, btokenType } = args;

  return BankFunctions.createBankAndShare(
    tx,
    [lendingMarketType, coinType, btokenType],
    {
      registry: tx.object(args.registry),
      metaT: tx.object(args.coinMetaT),
      metaB: tx.object(args.coinMetaBToken),
      btokenTreasury: tx.object(args.btokenTreasury),
      lendingMarket: tx.object(args.lendingMarket),
    },
    pkgInfo.publishedAt,
  );
}
