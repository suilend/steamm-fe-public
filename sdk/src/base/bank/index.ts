import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import { BankFunctions } from "../..";
import { BankInfo } from "../../types";

import {
  BurnBTokensArgs,
  CTokenAmountArgs,
  CreateBankArgs,
  InitLendingArgs,
  MigrateBankArgs,
  MintBTokensArgs,
  SetBankUtilisationBpsArgs,
} from "./bankArgs";

export * from "./bankArgs";
export * from "./bankMath";

export class Bank {
  public packageId: string;
  public bankInfo: BankInfo;

  constructor(packageId: string, bankInfo: BankInfo) {
    this.bankInfo = bankInfo;
    this.packageId = packageId;
  }

  public mintBTokens(
    tx: Transaction,
    args: MintBTokensArgs,
  ): TransactionResult {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      coins: args.coins,
      coinAmount: args.coinAmount,
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    const coinA = BankFunctions.mintBtokens(
      tx,
      this.typeArgs(),
      callArgs,
      this.packageId,
    );
    return coinA;
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

    const coinA = BankFunctions.burnBtokens(
      tx,
      this.typeArgs(),
      callArgs,
      this.packageId,
    );
    return coinA;
  }

  public initLending(tx: Transaction, args: InitLendingArgs) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      globalAdmin: args.globalAdmin,
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      targetUtilisationBps: args.targetUtilisationBps,
      utilisationBufferBps: args.utilisationBufferBps,
    };

    BankFunctions.initLending(tx, this.typeArgs(), callArgs, this.packageId);
  }

  public rebalance(tx: Transaction) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    BankFunctions.rebalance(tx, this.typeArgs(), callArgs, this.packageId);
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
      this.packageId,
    );
  }

  public toBTokens(
    tx: Transaction,
    args: { amount: bigint | TransactionArgument },
  ): TransactionArgument {
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
      this.packageId,
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
      this.packageId,
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
      this.packageId,
    );
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
      this.packageId,
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
      this.packageId,
    );
  }

  public viewFundsAvailable(tx: Transaction): TransactionArgument {
    return BankFunctions.fundsAvailable(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.packageId,
    );
  }

  public viewTargetUtilisationBps(tx: Transaction): TransactionArgument {
    return BankFunctions.targetUtilisationBps(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.packageId,
    );
  }

  public viewUtilisationBufferBps(tx: Transaction): TransactionArgument {
    return BankFunctions.utilisationBufferBps(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.packageId,
    );
  }

  public viewTargetUtilisationBpsUnchecked(
    tx: Transaction,
  ): TransactionArgument {
    return BankFunctions.targetUtilisationBpsUnchecked(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.packageId,
    );
  }

  public viewUtilisationBufferBpsUnchecked(
    tx: Transaction,
  ): TransactionArgument {
    return BankFunctions.utilisationBufferBpsUnchecked(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.packageId,
    );
  }

  public viewReserveArrayIndex(tx: Transaction): TransactionArgument {
    return BankFunctions.reserveArrayIndex(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.packageId,
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
  packageId: string,
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
    packageId,
  );
}
