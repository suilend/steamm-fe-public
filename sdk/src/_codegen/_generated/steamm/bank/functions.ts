import {PUBLISHED_AT} from "..";
import {obj, pure} from "../../_framework/util";
import {Transaction, TransactionArgument, TransactionObjectInput} from "@mysten/sui/transactions";

export interface RebalanceArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function rebalance( tx: Transaction, typeArgs: [string, string, string], args: RebalanceArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::rebalance`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export interface CtokenAmountArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; amount: bigint | TransactionArgument }

export function ctokenAmount( tx: Transaction, typeArgs: [string, string, string], args: CtokenAmountArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::ctoken_amount`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), pure(tx, args.amount, `u64`) ], }) }

export function reserveArrayIndex( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::reserve_array_index`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }

export interface MigrateArgs { bank: TransactionObjectInput; admin: TransactionObjectInput }

export function migrate( tx: Transaction, typeArgs: [string, string, string], args: MigrateArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::migrate`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.admin) ], }) }

export function fundsAvailable( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::funds_available`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }

export interface FundsDeployedArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function fundsDeployed( tx: Transaction, typeArgs: [string, string, string], args: FundsDeployedArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::funds_deployed`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export function targetUtilisationBps( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::target_utilisation_bps`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }

export function assertBtokenType( tx: Transaction, typeArgs: [string, string], publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::assert_btoken_type`, typeArguments: typeArgs, arguments: [ ], }) }

export interface BtokenRatioArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function btokenRatio( tx: Transaction, typeArgs: [string, string, string], args: BtokenRatioArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::btoken_ratio`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export interface BurnBtokensArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; btokens: TransactionObjectInput; btokenAmount: bigint | TransactionArgument; clock: TransactionObjectInput }

export function burnBtokens( tx: Transaction, typeArgs: [string, string, string], args: BurnBtokensArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::burn_btokens`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.btokens), pure(tx, args.btokenAmount, `u64`), obj(tx, args.clock) ], }) }

export interface CompoundInterestIfAnyArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function compoundInterestIfAny( tx: Transaction, typeArgs: [string, string, string], args: CompoundInterestIfAnyArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::compound_interest_if_any`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export interface CreateBankArgs { registry: TransactionObjectInput; metaT: TransactionObjectInput; metaB: TransactionObjectInput; btokenTreasury: TransactionObjectInput; lendingMarket: TransactionObjectInput }

export function createBank( tx: Transaction, typeArgs: [string, string, string], args: CreateBankArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::create_bank`, typeArguments: typeArgs, arguments: [ obj(tx, args.registry), obj(tx, args.metaT), obj(tx, args.metaB), obj(tx, args.btokenTreasury), obj(tx, args.lendingMarket) ], }) }

export interface CreateBankAndShareArgs { registry: TransactionObjectInput; metaT: TransactionObjectInput; metaB: TransactionObjectInput; btokenTreasury: TransactionObjectInput; lendingMarket: TransactionObjectInput }

export function createBankAndShare( tx: Transaction, typeArgs: [string, string, string], args: CreateBankAndShareArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::create_bank_and_share`, typeArguments: typeArgs, arguments: [ obj(tx, args.registry), obj(tx, args.metaT), obj(tx, args.metaB), obj(tx, args.btokenTreasury), obj(tx, args.lendingMarket) ], }) }

export interface DeployArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; amountToDeploy: bigint | TransactionArgument; clock: TransactionObjectInput }

export function deploy( tx: Transaction, typeArgs: [string, string, string], args: DeployArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::deploy`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), pure(tx, args.amountToDeploy, `u64`), obj(tx, args.clock) ], }) }

export interface EffectiveUtilisationBpsArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function effectiveUtilisationBps( tx: Transaction, typeArgs: [string, string, string], args: EffectiveUtilisationBpsArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::effective_utilisation_bps`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export interface FromBtokensArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; btokenAmount: bigint | TransactionArgument; clock: TransactionObjectInput }

export function fromBtokens( tx: Transaction, typeArgs: [string, string, string], args: FromBtokensArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::from_btokens`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), pure(tx, args.btokenAmount, `u64`), obj(tx, args.clock) ], }) }

export interface InitLendingArgs { bank: TransactionObjectInput; globalAdmin: TransactionObjectInput; lendingMarket: TransactionObjectInput; targetUtilisationBps: number | TransactionArgument; utilisationBufferBps: number | TransactionArgument }

export function initLending( tx: Transaction, typeArgs: [string, string, string], args: InitLendingArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::init_lending`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.globalAdmin), obj(tx, args.lendingMarket), pure(tx, args.targetUtilisationBps, `u16`), pure(tx, args.utilisationBufferBps, `u16`) ], }) }

export function utilisationBufferBps( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::utilisation_buffer_bps`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }

export function lending( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::lending`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }

export interface MintBtokensArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; coins: TransactionObjectInput; coinAmount: bigint | TransactionArgument; clock: TransactionObjectInput }

export function mintBtokens( tx: Transaction, typeArgs: [string, string, string], args: MintBtokensArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::mint_btokens`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.coins), pure(tx, args.coinAmount, `u64`), obj(tx, args.clock) ], }) }

export interface NeedsRebalanceArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function needsRebalance( tx: Transaction, typeArgs: [string, string, string], args: NeedsRebalanceArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::needs_rebalance`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export interface PrepareForPendingWithdrawArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; withdrawAmount: bigint | TransactionArgument; clock: TransactionObjectInput }

export function prepareForPendingWithdraw( tx: Transaction, typeArgs: [string, string, string], args: PrepareForPendingWithdrawArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::prepare_for_pending_withdraw`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), pure(tx, args.withdrawAmount, `u64`), obj(tx, args.clock) ], }) }

export interface RecallArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; amountToRecall: bigint | TransactionArgument; clock: TransactionObjectInput }

export function recall( tx: Transaction, typeArgs: [string, string, string], args: RecallArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::recall`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), pure(tx, args.amountToRecall, `u64`), obj(tx, args.clock) ], }) }

export interface SetUtilisationBpsArgs { bank: TransactionObjectInput; globalAdmin: TransactionObjectInput; targetUtilisationBps: number | TransactionArgument; utilisationBufferBps: number | TransactionArgument }

export function setUtilisationBps( tx: Transaction, typeArgs: [string, string, string], args: SetUtilisationBpsArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::set_utilisation_bps`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.globalAdmin), pure(tx, args.targetUtilisationBps, `u16`), pure(tx, args.utilisationBufferBps, `u16`) ], }) }

export function targetUtilisationBpsUnchecked( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::target_utilisation_bps_unchecked`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }

export interface ToBtokensArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; amount: bigint | TransactionArgument; clock: TransactionObjectInput }

export function toBtokens( tx: Transaction, typeArgs: [string, string, string], args: ToBtokensArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::to_btokens`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), pure(tx, args.amount, `u64`), obj(tx, args.clock) ], }) }

export interface TotalFundsArgs { bank: TransactionObjectInput; lendingMarket: TransactionObjectInput; clock: TransactionObjectInput }

export function totalFunds( tx: Transaction, typeArgs: [string, string, string], args: TotalFundsArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::total_funds`, typeArguments: typeArgs, arguments: [ obj(tx, args.bank), obj(tx, args.lendingMarket), obj(tx, args.clock) ], }) }

export interface UpdateBtokenMetadataArgs { metaA: TransactionObjectInput; metaBtoken: TransactionObjectInput; treasuryBtoken: TransactionObjectInput }

export function updateBtokenMetadata( tx: Transaction, typeArgs: [string, string], args: UpdateBtokenMetadataArgs, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::update_btoken_metadata`, typeArguments: typeArgs, arguments: [ obj(tx, args.metaA), obj(tx, args.metaBtoken), obj(tx, args.treasuryBtoken) ], }) }

export function utilisationBufferBpsUnchecked( tx: Transaction, typeArgs: [string, string, string], bank: TransactionObjectInput, publishedAt: string = PUBLISHED_AT ) {return tx.moveCall({ target: `${publishedAt}::bank::utilisation_buffer_bps_unchecked`, typeArguments: typeArgs, arguments: [ obj(tx, bank) ], }) }
