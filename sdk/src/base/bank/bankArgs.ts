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
  coins: TransactionObjectInput;
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

export interface MigrateBankArgs {
  admin: TransactionObjectInput;
}

export interface PoolPrepareBankForPendingWithdrawArgs {
  intent: TransactionObjectInput;
}

export interface PoolNeedsLendingActionOnSwapArgs {
  quote: TransactionObjectInput;
}
