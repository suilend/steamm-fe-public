import {
  Transaction,
  TransactionArgument,
  TransactionObjectInput,
  TransactionResult,
} from "@mysten/sui/transactions";
import {
  SUI_CLOCK_OBJECT_ID,
  SUI_SYSTEM_STATE_OBJECT_ID,
} from "@mysten/sui/utils";

import { Codegen } from "../..";
import { BankInfo, PackageInfo, SteammInfo } from "../../types";

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

export class BankAbi {
  public originalId: string;
  public publishedAt: string;
  public bankInfo: BankInfo;

  constructor(pkgInfo: SteammInfo, bankInfo: BankInfo) {
    this.bankInfo = bankInfo;
    this.originalId = pkgInfo.originalId;
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

    const bToken = Codegen.Bank.mintBtoken(
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

    const coin = Codegen.Bank.burnBtoken(
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

    Codegen.Bank.initLending(tx, this.typeArgs(), callArgs, this.publishedAt);
  }

  public rebalance(tx: Transaction) {
    const [lendingMarketType, coinType, bTokenType] = this.typeArgs();

    if (coinType === "0x2::sui::SUI") {
      const callArgs = {
        bank: tx.object(this.bankInfo.bankId),
        lendingMarket: tx.object(this.bankInfo.lendingMarketId),
        suiSystem: tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
        clock: tx.object(SUI_CLOCK_OBJECT_ID),
      };

      Codegen.Bank.rebalanceSui(
        tx,
        [lendingMarketType, bTokenType],
        callArgs,
        this.publishedAt,
      );
    } else {
      const callArgs = {
        bank: tx.object(this.bankInfo.bankId),
        lendingMarket: tx.object(this.bankInfo.lendingMarketId),
        clock: tx.object(SUI_CLOCK_OBJECT_ID),
      };

      Codegen.Bank.rebalance(tx, this.typeArgs(), callArgs, this.publishedAt);
    }
  }

  public compoundInterestIfAny(tx: Transaction) {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    Codegen.Bank.compoundInterestIfAny(
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

    return Codegen.Bank.toBtokens(
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

    return Codegen.Bank.fromBtokens(
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

    return Codegen.Bank.ctokenAmount(
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

    Codegen.Bank.setUtilisationBps(
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

    Codegen.Bank.setMinTokenBlockSize(
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

    Codegen.Bank.migrate(tx, this.typeArgs(), callArgs);
  }

  // Client-side logic

  public needsRebalance(tx: Transaction): TransactionArgument {
    const callArgs = {
      bank: tx.object(this.bankInfo.bankId),
      lendingMarket: tx.object(this.bankInfo.lendingMarketId),
      clock: tx.object(SUI_CLOCK_OBJECT_ID),
    };

    return Codegen.Bank.needsRebalance(tx, this.typeArgs(), callArgs);
  }

  // Getters

  public viewLending(tx: Transaction): TransactionArgument {
    return Codegen.Bank.lending(
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

    return Codegen.Bank.totalFunds(
      tx,
      this.typeArgs(),
      callArgs,
      this.publishedAt,
    );
  }

  public viewFundsAvailable(tx: Transaction): TransactionArgument {
    return Codegen.Bank.fundsAvailable(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewTargetUtilisationBps(tx: Transaction): TransactionArgument {
    return Codegen.Bank.targetUtilisationBps(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewUtilisationBufferBps(tx: Transaction): TransactionArgument {
    return Codegen.Bank.utilisationBufferBps(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewTargetUtilisationBpsUnchecked(
    tx: Transaction,
  ): TransactionArgument {
    return Codegen.Bank.targetUtilisationBpsUnchecked(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewUtilisationBufferBpsUnchecked(
    tx: Transaction,
  ): TransactionArgument {
    return Codegen.Bank.utilisationBufferBpsUnchecked(
      tx,
      this.typeArgs(),
      tx.object(this.bankInfo.bankId),
      this.publishedAt,
    );
  }

  public viewReserveArrayIndex(tx: Transaction): TransactionArgument {
    return Codegen.Bank.reserveArrayIndex(
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

  return Codegen.Bank.createBankAndShare(
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
