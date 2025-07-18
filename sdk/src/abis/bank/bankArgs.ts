import {
  TransactionArgument,
  TransactionObjectInput,
} from "@mysten/sui/transactions";

export interface InitLendingArgs {
  globalAdmin: TransactionObjectInput;
  targetUtilisationBps: number | TransactionArgument;
  utilisationBufferBps: number | TransactionArgument;
}

export interface MintBTokensArgs {
  coin: TransactionObjectInput;
  coinAmount: bigint | TransactionArgument;
}

export interface BurnBTokensArgs {
  btokens: TransactionObjectInput;
  btokenAmount: bigint | TransactionArgument;
}
export interface CTokenAmountArgs {
  amount: bigint | TransactionArgument;
}

export interface SetBankUtilisationBpsArgs {
  globalAdmin: TransactionObjectInput;
  targetUtilisationBps: number | TransactionArgument;
  utilisationBufferBps: number | TransactionArgument;
}

export interface SetMinTokenBlockSizeArgs {
  globalAdmin: TransactionObjectInput;
  minTokenBlockSize: number | TransactionArgument;
}

export interface MigrateBankArgs {
  admin: TransactionObjectInput;
}

export interface PoolPrepareBankForPendingWithdrawArgs {
  intent: TransactionObjectInput;
}

export interface PoolNeedsLendingActionOnSwapArgs {
  quote: TransactionObjectInput;
}

export interface LendingObjectsArgs {
  bankA: TransactionObjectInput;
  bankB: TransactionObjectInput;
  lendingMarket: TransactionObjectInput;
}

export interface CreateBankArgs {
  lendingMarketType: string;
  coinType: string;
  btokenType: string;
  registry: string | TransactionObjectInput;
  coinMetaT: string | TransactionObjectInput;
  coinMetaBToken: string | TransactionObjectInput;
  btokenTreasury: string | TransactionObjectInput;
  lendingMarket: string | TransactionObjectInput;
}
