import {PUBLISHED_AT} from "..";
import {pure} from "../../_framework/util";
import {Transaction, TransactionArgument} from "@mysten/sui/transactions";

export interface AssertOutputArgs { liquidReserve: bigint | TransactionArgument; lent: bigint | TransactionArgument; output: bigint | TransactionArgument }

export function assertOutput( tx: Transaction, args: AssertOutputArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank_math::assert_output`, arguments: [ pure(tx, args.liquidReserve, `u64`), pure(tx, args.lent, `u64`), pure(tx, args.output, `u64`) ], }) }

export interface ComputeAmountToDeployArgs { fundsAvailable: bigint | TransactionArgument; fundsDeployed: bigint | TransactionArgument; targetUtilisation: bigint | TransactionArgument }

export function computeAmountToDeploy( tx: Transaction, args: ComputeAmountToDeployArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank_math::compute_amount_to_deploy`, arguments: [ pure(tx, args.fundsAvailable, `u64`), pure(tx, args.fundsDeployed, `u64`), pure(tx, args.targetUtilisation, `u64`) ], }) }

export interface ComputeAmountToRecallArgs { fundsAvailable: bigint | TransactionArgument; withdrawAmount: bigint | TransactionArgument; fundsDeployed: bigint | TransactionArgument; targetUtilisation: bigint | TransactionArgument }

export function computeAmountToRecall( tx: Transaction, args: ComputeAmountToRecallArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank_math::compute_amount_to_recall`, arguments: [ pure(tx, args.fundsAvailable, `u64`), pure(tx, args.withdrawAmount, `u64`), pure(tx, args.fundsDeployed, `u64`), pure(tx, args.targetUtilisation, `u64`) ], }) }

export interface ComputeRecallForPendingWithdrawArgs { fundsAvailable: bigint | TransactionArgument; withdrawAmount: bigint | TransactionArgument; fundsDeployed: bigint | TransactionArgument; targetUtilisationBps: bigint | TransactionArgument; bufferBps: bigint | TransactionArgument }

export function computeRecallForPendingWithdraw( tx: Transaction, args: ComputeRecallForPendingWithdrawArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank_math::compute_recall_for_pending_withdraw`, arguments: [ pure(tx, args.fundsAvailable, `u64`), pure(tx, args.withdrawAmount, `u64`), pure(tx, args.fundsDeployed, `u64`), pure(tx, args.targetUtilisationBps, `u64`), pure(tx, args.bufferBps, `u64`) ], }) }

export interface ComputeUtilisationBpsArgs { fundsAvailable: bigint | TransactionArgument; fundsDeployed: bigint | TransactionArgument }

export function computeUtilisationBps( tx: Transaction, args: ComputeUtilisationBpsArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank_math::compute_utilisation_bps`, arguments: [ pure(tx, args.fundsAvailable, `u64`), pure(tx, args.fundsDeployed, `u64`) ], }) }
