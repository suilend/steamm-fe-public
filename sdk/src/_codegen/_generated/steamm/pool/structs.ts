import {TypeName} from "../../_dependencies/source/0x1/type-name/structs";
import {Balance, Supply} from "../../_dependencies/source/0x2/balance/structs";
import {ID, UID} from "../../_dependencies/source/0x2/object/structs";
import {PhantomReified, PhantomToTypeStr, PhantomTypeArgument, Reified, StructClass, ToField, ToPhantomTypeArgument, ToTypeArgument, ToTypeStr, TypeArgument, assertFieldsWithTypesArgsMatch, assertReifiedTypeArgsMatch, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, extractType, fieldToJSON, phantom, toBcs} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType, parseTypeName} from "../../_framework/util";
import {FeeConfig, Fees} from "../fees/structs";
import {PKG_V1} from "../index";
import {SwapFee} from "../quote/structs";
import {Version} from "../version/structs";
import {BcsType, bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== DepositResult =============================== */

export function isDepositResult(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::pool::DepositResult`; }

export interface DepositResultFields { user: ToField<"address">; poolId: ToField<ID>; depositA: ToField<"u64">; depositB: ToField<"u64">; mintLp: ToField<"u64"> }

export type DepositResultReified = Reified< DepositResult, DepositResultFields >;

export class DepositResult implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::DepositResult`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = DepositResult.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::DepositResult`; readonly $typeArgs: []; readonly $isPhantom = DepositResult.$isPhantom;

 readonly user: ToField<"address">; readonly poolId: ToField<ID>; readonly depositA: ToField<"u64">; readonly depositB: ToField<"u64">; readonly mintLp: ToField<"u64">

 private constructor(typeArgs: [], fields: DepositResultFields, ) { this.$fullTypeName = composeSuiType( DepositResult.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::DepositResult`; this.$typeArgs = typeArgs;

 this.user = fields.user;; this.poolId = fields.poolId;; this.depositA = fields.depositA;; this.depositB = fields.depositB;; this.mintLp = fields.mintLp; }

 static reified( ): DepositResultReified { return { typeName: DepositResult.$typeName, fullTypeName: composeSuiType( DepositResult.$typeName, ...[] ) as `${typeof PKG_V1}::pool::DepositResult`, typeArgs: [ ] as [], isPhantom: DepositResult.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => DepositResult.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => DepositResult.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => DepositResult.fromBcs( data, ), bcs: DepositResult.bcs, fromJSONField: (field: any) => DepositResult.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => DepositResult.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => DepositResult.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => DepositResult.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => DepositResult.fetch( client, id, ), new: ( fields: DepositResultFields, ) => { return new DepositResult( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return DepositResult.reified() }

 static phantom( ): PhantomReified<ToTypeStr<DepositResult>> { return phantom(DepositResult.reified( )); } static get p() { return DepositResult.phantom() }

 static get bcs() { return bcs.struct("DepositResult", {

 user: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), pool_id: ID.bcs, deposit_a: bcs.u64(), deposit_b: bcs.u64(), mint_lp: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): DepositResult { return DepositResult.reified( ).new( { user: decodeFromFields("address", fields.user), poolId: decodeFromFields(ID.reified(), fields.pool_id), depositA: decodeFromFields("u64", fields.deposit_a), depositB: decodeFromFields("u64", fields.deposit_b), mintLp: decodeFromFields("u64", fields.mint_lp) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): DepositResult { if (!isDepositResult(item.type)) { throw new Error("not a DepositResult type");

 }

 return DepositResult.reified( ).new( { user: decodeFromFieldsWithTypes("address", item.fields.user), poolId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_id), depositA: decodeFromFieldsWithTypes("u64", item.fields.deposit_a), depositB: decodeFromFieldsWithTypes("u64", item.fields.deposit_b), mintLp: decodeFromFieldsWithTypes("u64", item.fields.mint_lp) } ) }

 static fromBcs( data: Uint8Array ): DepositResult { return DepositResult.fromFields( DepositResult.bcs.parse(data) ) }

 toJSONField() { return {

 user: this.user,poolId: this.poolId,depositA: this.depositA.toString(),depositB: this.depositB.toString(),mintLp: this.mintLp.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): DepositResult { return DepositResult.reified( ).new( { user: decodeFromJSONField("address", field.user), poolId: decodeFromJSONField(ID.reified(), field.poolId), depositA: decodeFromJSONField("u64", field.depositA), depositB: decodeFromJSONField("u64", field.depositB), mintLp: decodeFromJSONField("u64", field.mintLp) } ) }

 static fromJSON( json: Record<string, any> ): DepositResult { if (json.$typeName !== DepositResult.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return DepositResult.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): DepositResult { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isDepositResult(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a DepositResult object`); } return DepositResult.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): DepositResult { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isDepositResult(data.bcs.type)) { throw new Error(`object at is not a DepositResult object`); }

 return DepositResult.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return DepositResult.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<DepositResult> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching DepositResult object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isDepositResult(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a DepositResult object`); }

 return DepositResult.fromSuiObjectData( res.data ); }

 }

/* ============================== NewPoolResult =============================== */

export function isNewPoolResult(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::pool::NewPoolResult`; }

export interface NewPoolResultFields { creator: ToField<"address">; poolId: ToField<ID>; poolCapId: ToField<ID>; coinTypeA: ToField<TypeName>; coinTypeB: ToField<TypeName>; quoterType: ToField<TypeName>; lpTokenType: ToField<TypeName> }

export type NewPoolResultReified = Reified< NewPoolResult, NewPoolResultFields >;

export class NewPoolResult implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::NewPoolResult`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = NewPoolResult.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::NewPoolResult`; readonly $typeArgs: []; readonly $isPhantom = NewPoolResult.$isPhantom;

 readonly creator: ToField<"address">; readonly poolId: ToField<ID>; readonly poolCapId: ToField<ID>; readonly coinTypeA: ToField<TypeName>; readonly coinTypeB: ToField<TypeName>; readonly quoterType: ToField<TypeName>; readonly lpTokenType: ToField<TypeName>

 private constructor(typeArgs: [], fields: NewPoolResultFields, ) { this.$fullTypeName = composeSuiType( NewPoolResult.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::NewPoolResult`; this.$typeArgs = typeArgs;

 this.creator = fields.creator;; this.poolId = fields.poolId;; this.poolCapId = fields.poolCapId;; this.coinTypeA = fields.coinTypeA;; this.coinTypeB = fields.coinTypeB;; this.quoterType = fields.quoterType;; this.lpTokenType = fields.lpTokenType; }

 static reified( ): NewPoolResultReified { return { typeName: NewPoolResult.$typeName, fullTypeName: composeSuiType( NewPoolResult.$typeName, ...[] ) as `${typeof PKG_V1}::pool::NewPoolResult`, typeArgs: [ ] as [], isPhantom: NewPoolResult.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => NewPoolResult.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => NewPoolResult.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => NewPoolResult.fromBcs( data, ), bcs: NewPoolResult.bcs, fromJSONField: (field: any) => NewPoolResult.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => NewPoolResult.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => NewPoolResult.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => NewPoolResult.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => NewPoolResult.fetch( client, id, ), new: ( fields: NewPoolResultFields, ) => { return new NewPoolResult( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return NewPoolResult.reified() }

 static phantom( ): PhantomReified<ToTypeStr<NewPoolResult>> { return phantom(NewPoolResult.reified( )); } static get p() { return NewPoolResult.phantom() }

 static get bcs() { return bcs.struct("NewPoolResult", {

 creator: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), pool_id: ID.bcs, pool_cap_id: ID.bcs, coin_type_a: TypeName.bcs, coin_type_b: TypeName.bcs, quoter_type: TypeName.bcs, lp_token_type: TypeName.bcs

}) };

 static fromFields( fields: Record<string, any> ): NewPoolResult { return NewPoolResult.reified( ).new( { creator: decodeFromFields("address", fields.creator), poolId: decodeFromFields(ID.reified(), fields.pool_id), poolCapId: decodeFromFields(ID.reified(), fields.pool_cap_id), coinTypeA: decodeFromFields(TypeName.reified(), fields.coin_type_a), coinTypeB: decodeFromFields(TypeName.reified(), fields.coin_type_b), quoterType: decodeFromFields(TypeName.reified(), fields.quoter_type), lpTokenType: decodeFromFields(TypeName.reified(), fields.lp_token_type) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): NewPoolResult { if (!isNewPoolResult(item.type)) { throw new Error("not a NewPoolResult type");

 }

 return NewPoolResult.reified( ).new( { creator: decodeFromFieldsWithTypes("address", item.fields.creator), poolId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_id), poolCapId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_cap_id), coinTypeA: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.coin_type_a), coinTypeB: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.coin_type_b), quoterType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.quoter_type), lpTokenType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.lp_token_type) } ) }

 static fromBcs( data: Uint8Array ): NewPoolResult { return NewPoolResult.fromFields( NewPoolResult.bcs.parse(data) ) }

 toJSONField() { return {

 creator: this.creator,poolId: this.poolId,poolCapId: this.poolCapId,coinTypeA: this.coinTypeA.toJSONField(),coinTypeB: this.coinTypeB.toJSONField(),quoterType: this.quoterType.toJSONField(),lpTokenType: this.lpTokenType.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): NewPoolResult { return NewPoolResult.reified( ).new( { creator: decodeFromJSONField("address", field.creator), poolId: decodeFromJSONField(ID.reified(), field.poolId), poolCapId: decodeFromJSONField(ID.reified(), field.poolCapId), coinTypeA: decodeFromJSONField(TypeName.reified(), field.coinTypeA), coinTypeB: decodeFromJSONField(TypeName.reified(), field.coinTypeB), quoterType: decodeFromJSONField(TypeName.reified(), field.quoterType), lpTokenType: decodeFromJSONField(TypeName.reified(), field.lpTokenType) } ) }

 static fromJSON( json: Record<string, any> ): NewPoolResult { if (json.$typeName !== NewPoolResult.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return NewPoolResult.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): NewPoolResult { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isNewPoolResult(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a NewPoolResult object`); } return NewPoolResult.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): NewPoolResult { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isNewPoolResult(data.bcs.type)) { throw new Error(`object at is not a NewPoolResult object`); }

 return NewPoolResult.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return NewPoolResult.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<NewPoolResult> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching NewPoolResult object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isNewPoolResult(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a NewPoolResult object`); }

 return NewPoolResult.fromSuiObjectData( res.data ); }

 }

/* ============================== Pool =============================== */

export function isPool(type: string): boolean { type = compressSuiType(type); return type.startsWith(`${PKG_V1}::pool::Pool` + '<'); }

export interface PoolFields<A extends PhantomTypeArgument, B extends PhantomTypeArgument, Quoter extends TypeArgument, LpType extends PhantomTypeArgument> { id: ToField<UID>; quoter: ToField<Quoter>; balanceA: ToField<Balance<A>>; balanceB: ToField<Balance<B>>; lpSupply: ToField<Supply<LpType>>; protocolFees: ToField<Fees<A, B>>; poolFeeConfig: ToField<FeeConfig>; redemptionFees: ToField<Fees<A, B>>; tradingData: ToField<TradingData>; version: ToField<Version> }

export type PoolReified<A extends PhantomTypeArgument, B extends PhantomTypeArgument, Quoter extends TypeArgument, LpType extends PhantomTypeArgument> = Reified< Pool<A, B, Quoter, LpType>, PoolFields<A, B, Quoter, LpType> >;

export class Pool<A extends PhantomTypeArgument, B extends PhantomTypeArgument, Quoter extends TypeArgument, LpType extends PhantomTypeArgument> implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::Pool`; static readonly $numTypeParams = 4; static readonly $isPhantom = [true,true,false,true,] as const;

 readonly $typeName = Pool.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::Pool<${PhantomToTypeStr<A>}, ${PhantomToTypeStr<B>}, ${ToTypeStr<Quoter>}, ${PhantomToTypeStr<LpType>}>`; readonly $typeArgs: [PhantomToTypeStr<A>, PhantomToTypeStr<B>, ToTypeStr<Quoter>, PhantomToTypeStr<LpType>]; readonly $isPhantom = Pool.$isPhantom;

 readonly id: ToField<UID>; readonly quoter: ToField<Quoter>; readonly balanceA: ToField<Balance<A>>; readonly balanceB: ToField<Balance<B>>; readonly lpSupply: ToField<Supply<LpType>>; readonly protocolFees: ToField<Fees<A, B>>; readonly poolFeeConfig: ToField<FeeConfig>; readonly redemptionFees: ToField<Fees<A, B>>; readonly tradingData: ToField<TradingData>; readonly version: ToField<Version>

 private constructor(typeArgs: [PhantomToTypeStr<A>, PhantomToTypeStr<B>, ToTypeStr<Quoter>, PhantomToTypeStr<LpType>], fields: PoolFields<A, B, Quoter, LpType>, ) { this.$fullTypeName = composeSuiType( Pool.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::Pool<${PhantomToTypeStr<A>}, ${PhantomToTypeStr<B>}, ${ToTypeStr<Quoter>}, ${PhantomToTypeStr<LpType>}>`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.quoter = fields.quoter;; this.balanceA = fields.balanceA;; this.balanceB = fields.balanceB;; this.lpSupply = fields.lpSupply;; this.protocolFees = fields.protocolFees;; this.poolFeeConfig = fields.poolFeeConfig;; this.redemptionFees = fields.redemptionFees;; this.tradingData = fields.tradingData;; this.version = fields.version; }

 static reified<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( A: A, B: B, Quoter: Quoter, LpType: LpType ): PoolReified<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return { typeName: Pool.$typeName, fullTypeName: composeSuiType( Pool.$typeName, ...[extractType(A), extractType(B), extractType(Quoter), extractType(LpType)] ) as `${typeof PKG_V1}::pool::Pool<${PhantomToTypeStr<ToPhantomTypeArgument<A>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<B>>}, ${ToTypeStr<ToTypeArgument<Quoter>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<LpType>>}>`, typeArgs: [ extractType(A), extractType(B), extractType(Quoter), extractType(LpType) ] as [PhantomToTypeStr<ToPhantomTypeArgument<A>>, PhantomToTypeStr<ToPhantomTypeArgument<B>>, ToTypeStr<ToTypeArgument<Quoter>>, PhantomToTypeStr<ToPhantomTypeArgument<LpType>>], isPhantom: Pool.$isPhantom, reifiedTypeArgs: [A, B, Quoter, LpType], fromFields: (fields: Record<string, any>) => Pool.fromFields( [A, B, Quoter, LpType], fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Pool.fromFieldsWithTypes( [A, B, Quoter, LpType], item, ), fromBcs: (data: Uint8Array) => Pool.fromBcs( [A, B, Quoter, LpType], data, ), bcs: Pool.bcs(toBcs(Quoter)), fromJSONField: (field: any) => Pool.fromJSONField( [A, B, Quoter, LpType], field, ), fromJSON: (json: Record<string, any>) => Pool.fromJSON( [A, B, Quoter, LpType], json, ), fromSuiParsedData: (content: SuiParsedData) => Pool.fromSuiParsedData( [A, B, Quoter, LpType], content, ), fromSuiObjectData: (content: SuiObjectData) => Pool.fromSuiObjectData( [A, B, Quoter, LpType], content, ), fetch: async (client: SuiClient, id: string) => Pool.fetch( client, [A, B, Quoter, LpType], id, ), new: ( fields: PoolFields<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>>, ) => { return new Pool( [extractType(A), extractType(B), extractType(Quoter), extractType(LpType)], fields ) }, kind: "StructClassReified", } }

 static get r() { return Pool.reified }

 static phantom<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( A: A, B: B, Quoter: Quoter, LpType: LpType ): PhantomReified<ToTypeStr<Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>>>> { return phantom(Pool.reified( A, B, Quoter, LpType )); } static get p() { return Pool.phantom }

 static get bcs() { return <Quoter extends BcsType<any>>(Quoter: Quoter) => bcs.struct(`Pool<${Quoter.name}>`, {

 id: UID.bcs, quoter: Quoter, balance_a: Balance.bcs, balance_b: Balance.bcs, lp_supply: Supply.bcs, protocol_fees: Fees.bcs, pool_fee_config: FeeConfig.bcs, redemption_fees: Fees.bcs, trading_data: TradingData.bcs, version: Version.bcs

}) };

 static fromFields<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], fields: Record<string, any> ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return Pool.reified( typeArgs[0], typeArgs[1], typeArgs[2], typeArgs[3], ).new( { id: decodeFromFields(UID.reified(), fields.id), quoter: decodeFromFields(typeArgs[2], fields.quoter), balanceA: decodeFromFields(Balance.reified(typeArgs[0]), fields.balance_a), balanceB: decodeFromFields(Balance.reified(typeArgs[1]), fields.balance_b), lpSupply: decodeFromFields(Supply.reified(typeArgs[3]), fields.lp_supply), protocolFees: decodeFromFields(Fees.reified(typeArgs[0], typeArgs[1]), fields.protocol_fees), poolFeeConfig: decodeFromFields(FeeConfig.reified(), fields.pool_fee_config), redemptionFees: decodeFromFields(Fees.reified(typeArgs[0], typeArgs[1]), fields.redemption_fees), tradingData: decodeFromFields(TradingData.reified(), fields.trading_data), version: decodeFromFields(Version.reified(), fields.version) } ) }

 static fromFieldsWithTypes<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], item: FieldsWithTypes ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (!isPool(item.type)) { throw new Error("not a Pool type");

 } assertFieldsWithTypesArgsMatch(item, typeArgs);

 return Pool.reified( typeArgs[0], typeArgs[1], typeArgs[2], typeArgs[3], ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), quoter: decodeFromFieldsWithTypes(typeArgs[2], item.fields.quoter), balanceA: decodeFromFieldsWithTypes(Balance.reified(typeArgs[0]), item.fields.balance_a), balanceB: decodeFromFieldsWithTypes(Balance.reified(typeArgs[1]), item.fields.balance_b), lpSupply: decodeFromFieldsWithTypes(Supply.reified(typeArgs[3]), item.fields.lp_supply), protocolFees: decodeFromFieldsWithTypes(Fees.reified(typeArgs[0], typeArgs[1]), item.fields.protocol_fees), poolFeeConfig: decodeFromFieldsWithTypes(FeeConfig.reified(), item.fields.pool_fee_config), redemptionFees: decodeFromFieldsWithTypes(Fees.reified(typeArgs[0], typeArgs[1]), item.fields.redemption_fees), tradingData: decodeFromFieldsWithTypes(TradingData.reified(), item.fields.trading_data), version: decodeFromFieldsWithTypes(Version.reified(), item.fields.version) } ) }

 static fromBcs<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], data: Uint8Array ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return Pool.fromFields( typeArgs, Pool.bcs( toBcs(typeArgs[2]) ).parse(data) ) }

 toJSONField() { return {

 id: this.id,quoter: fieldToJSON<Quoter>(this.$typeArgs[2], this.quoter),balanceA: this.balanceA.toJSONField(),balanceB: this.balanceB.toJSONField(),lpSupply: this.lpSupply.toJSONField(),protocolFees: this.protocolFees.toJSONField(),poolFeeConfig: this.poolFeeConfig.toJSONField(),redemptionFees: this.redemptionFees.toJSONField(),tradingData: this.tradingData.toJSONField(),version: this.version.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], field: any ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return Pool.reified( typeArgs[0], typeArgs[1], typeArgs[2], typeArgs[3], ).new( { id: decodeFromJSONField(UID.reified(), field.id), quoter: decodeFromJSONField(typeArgs[2], field.quoter), balanceA: decodeFromJSONField(Balance.reified(typeArgs[0]), field.balanceA), balanceB: decodeFromJSONField(Balance.reified(typeArgs[1]), field.balanceB), lpSupply: decodeFromJSONField(Supply.reified(typeArgs[3]), field.lpSupply), protocolFees: decodeFromJSONField(Fees.reified(typeArgs[0], typeArgs[1]), field.protocolFees), poolFeeConfig: decodeFromJSONField(FeeConfig.reified(), field.poolFeeConfig), redemptionFees: decodeFromJSONField(Fees.reified(typeArgs[0], typeArgs[1]), field.redemptionFees), tradingData: decodeFromJSONField(TradingData.reified(), field.tradingData), version: decodeFromJSONField(Version.reified(), field.version) } ) }

 static fromJSON<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], json: Record<string, any> ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (json.$typeName !== Pool.$typeName) { throw new Error("not a WithTwoGenerics json object") }; assertReifiedTypeArgsMatch( composeSuiType(Pool.$typeName, ...typeArgs.map(extractType)), json.$typeArgs, typeArgs, )

 return Pool.fromJSONField( typeArgs, json, ) }

 static fromSuiParsedData<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], content: SuiParsedData ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isPool(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Pool object`); } return Pool.fromFieldsWithTypes( typeArgs, content ); }

 static fromSuiObjectData<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], data: SuiObjectData ): Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isPool(data.bcs.type)) { throw new Error(`object at is not a Pool object`); }

 const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs; if (gotTypeArgs.length !== 4) { throw new Error(`type argument mismatch: expected 4 type arguments but got ${gotTypeArgs.length}`); }; for (let i = 0; i < 4; i++) { const gotTypeArg = compressSuiType(gotTypeArgs[i]); const expectedTypeArg = compressSuiType(extractType(typeArgs[i])); if (gotTypeArg !== expectedTypeArg) { throw new Error(`type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`); } };

 return Pool.fromBcs( typeArgs, fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Pool.fromSuiParsedData( typeArgs, data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends Reified<TypeArgument, any>, LpType extends PhantomReified<PhantomTypeArgument>>( client: SuiClient, typeArgs: [A, B, Quoter, LpType], id: string ): Promise<Pool<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>>> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Pool object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isPool(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Pool object`); }

 return Pool.fromSuiObjectData( typeArgs, res.data ); }

 }

/* ============================== PoolCap =============================== */

export function isPoolCap(type: string): boolean { type = compressSuiType(type); return type.startsWith(`${PKG_V1}::pool::PoolCap` + '<'); }

export interface PoolCapFields<A extends PhantomTypeArgument, B extends PhantomTypeArgument, Quoter extends PhantomTypeArgument, LpType extends PhantomTypeArgument> { id: ToField<UID>; poolId: ToField<ID> }

export type PoolCapReified<A extends PhantomTypeArgument, B extends PhantomTypeArgument, Quoter extends PhantomTypeArgument, LpType extends PhantomTypeArgument> = Reified< PoolCap<A, B, Quoter, LpType>, PoolCapFields<A, B, Quoter, LpType> >;

export class PoolCap<A extends PhantomTypeArgument, B extends PhantomTypeArgument, Quoter extends PhantomTypeArgument, LpType extends PhantomTypeArgument> implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::PoolCap`; static readonly $numTypeParams = 4; static readonly $isPhantom = [true,true,true,true,] as const;

 readonly $typeName = PoolCap.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::PoolCap<${PhantomToTypeStr<A>}, ${PhantomToTypeStr<B>}, ${PhantomToTypeStr<Quoter>}, ${PhantomToTypeStr<LpType>}>`; readonly $typeArgs: [PhantomToTypeStr<A>, PhantomToTypeStr<B>, PhantomToTypeStr<Quoter>, PhantomToTypeStr<LpType>]; readonly $isPhantom = PoolCap.$isPhantom;

 readonly id: ToField<UID>; readonly poolId: ToField<ID>

 private constructor(typeArgs: [PhantomToTypeStr<A>, PhantomToTypeStr<B>, PhantomToTypeStr<Quoter>, PhantomToTypeStr<LpType>], fields: PoolCapFields<A, B, Quoter, LpType>, ) { this.$fullTypeName = composeSuiType( PoolCap.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::PoolCap<${PhantomToTypeStr<A>}, ${PhantomToTypeStr<B>}, ${PhantomToTypeStr<Quoter>}, ${PhantomToTypeStr<LpType>}>`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.poolId = fields.poolId; }

 static reified<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( A: A, B: B, Quoter: Quoter, LpType: LpType ): PoolCapReified<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return { typeName: PoolCap.$typeName, fullTypeName: composeSuiType( PoolCap.$typeName, ...[extractType(A), extractType(B), extractType(Quoter), extractType(LpType)] ) as `${typeof PKG_V1}::pool::PoolCap<${PhantomToTypeStr<ToPhantomTypeArgument<A>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<B>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<Quoter>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<LpType>>}>`, typeArgs: [ extractType(A), extractType(B), extractType(Quoter), extractType(LpType) ] as [PhantomToTypeStr<ToPhantomTypeArgument<A>>, PhantomToTypeStr<ToPhantomTypeArgument<B>>, PhantomToTypeStr<ToPhantomTypeArgument<Quoter>>, PhantomToTypeStr<ToPhantomTypeArgument<LpType>>], isPhantom: PoolCap.$isPhantom, reifiedTypeArgs: [A, B, Quoter, LpType], fromFields: (fields: Record<string, any>) => PoolCap.fromFields( [A, B, Quoter, LpType], fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => PoolCap.fromFieldsWithTypes( [A, B, Quoter, LpType], item, ), fromBcs: (data: Uint8Array) => PoolCap.fromBcs( [A, B, Quoter, LpType], data, ), bcs: PoolCap.bcs, fromJSONField: (field: any) => PoolCap.fromJSONField( [A, B, Quoter, LpType], field, ), fromJSON: (json: Record<string, any>) => PoolCap.fromJSON( [A, B, Quoter, LpType], json, ), fromSuiParsedData: (content: SuiParsedData) => PoolCap.fromSuiParsedData( [A, B, Quoter, LpType], content, ), fromSuiObjectData: (content: SuiObjectData) => PoolCap.fromSuiObjectData( [A, B, Quoter, LpType], content, ), fetch: async (client: SuiClient, id: string) => PoolCap.fetch( client, [A, B, Quoter, LpType], id, ), new: ( fields: PoolCapFields<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>>, ) => { return new PoolCap( [extractType(A), extractType(B), extractType(Quoter), extractType(LpType)], fields ) }, kind: "StructClassReified", } }

 static get r() { return PoolCap.reified }

 static phantom<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( A: A, B: B, Quoter: Quoter, LpType: LpType ): PhantomReified<ToTypeStr<PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>>>> { return phantom(PoolCap.reified( A, B, Quoter, LpType )); } static get p() { return PoolCap.phantom }

 static get bcs() { return bcs.struct("PoolCap", {

 id: UID.bcs, pool_id: ID.bcs

}) };

 static fromFields<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], fields: Record<string, any> ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return PoolCap.reified( typeArgs[0], typeArgs[1], typeArgs[2], typeArgs[3], ).new( { id: decodeFromFields(UID.reified(), fields.id), poolId: decodeFromFields(ID.reified(), fields.pool_id) } ) }

 static fromFieldsWithTypes<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], item: FieldsWithTypes ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (!isPoolCap(item.type)) { throw new Error("not a PoolCap type");

 } assertFieldsWithTypesArgsMatch(item, typeArgs);

 return PoolCap.reified( typeArgs[0], typeArgs[1], typeArgs[2], typeArgs[3], ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), poolId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_id) } ) }

 static fromBcs<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], data: Uint8Array ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return PoolCap.fromFields( typeArgs, PoolCap.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,poolId: this.poolId,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], field: any ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { return PoolCap.reified( typeArgs[0], typeArgs[1], typeArgs[2], typeArgs[3], ).new( { id: decodeFromJSONField(UID.reified(), field.id), poolId: decodeFromJSONField(ID.reified(), field.poolId) } ) }

 static fromJSON<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], json: Record<string, any> ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (json.$typeName !== PoolCap.$typeName) { throw new Error("not a WithTwoGenerics json object") }; assertReifiedTypeArgsMatch( composeSuiType(PoolCap.$typeName, ...typeArgs.map(extractType)), json.$typeArgs, typeArgs, )

 return PoolCap.fromJSONField( typeArgs, json, ) }

 static fromSuiParsedData<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], content: SuiParsedData ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isPoolCap(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a PoolCap object`); } return PoolCap.fromFieldsWithTypes( typeArgs, content ); }

 static fromSuiObjectData<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B, Quoter, LpType], data: SuiObjectData ): PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>> { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isPoolCap(data.bcs.type)) { throw new Error(`object at is not a PoolCap object`); }

 const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs; if (gotTypeArgs.length !== 4) { throw new Error(`type argument mismatch: expected 4 type arguments but got ${gotTypeArgs.length}`); }; for (let i = 0; i < 4; i++) { const gotTypeArg = compressSuiType(gotTypeArgs[i]); const expectedTypeArg = compressSuiType(extractType(typeArgs[i])); if (gotTypeArg !== expectedTypeArg) { throw new Error(`type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`); } };

 return PoolCap.fromBcs( typeArgs, fromB64(data.bcs.bcsBytes) ); } if (data.content) { return PoolCap.fromSuiParsedData( typeArgs, data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>, Quoter extends PhantomReified<PhantomTypeArgument>, LpType extends PhantomReified<PhantomTypeArgument>>( client: SuiClient, typeArgs: [A, B, Quoter, LpType], id: string ): Promise<PoolCap<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>, ToPhantomTypeArgument<Quoter>, ToPhantomTypeArgument<LpType>>> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching PoolCap object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isPoolCap(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a PoolCap object`); }

 return PoolCap.fromSuiObjectData( typeArgs, res.data ); }

 }

/* ============================== RedeemResult =============================== */

export function isRedeemResult(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::pool::RedeemResult`; }

export interface RedeemResultFields { user: ToField<"address">; poolId: ToField<ID>; withdrawA: ToField<"u64">; withdrawB: ToField<"u64">; feesA: ToField<"u64">; feesB: ToField<"u64">; burnLp: ToField<"u64"> }

export type RedeemResultReified = Reified< RedeemResult, RedeemResultFields >;

export class RedeemResult implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::RedeemResult`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = RedeemResult.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::RedeemResult`; readonly $typeArgs: []; readonly $isPhantom = RedeemResult.$isPhantom;

 readonly user: ToField<"address">; readonly poolId: ToField<ID>; readonly withdrawA: ToField<"u64">; readonly withdrawB: ToField<"u64">; readonly feesA: ToField<"u64">; readonly feesB: ToField<"u64">; readonly burnLp: ToField<"u64">

 private constructor(typeArgs: [], fields: RedeemResultFields, ) { this.$fullTypeName = composeSuiType( RedeemResult.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::RedeemResult`; this.$typeArgs = typeArgs;

 this.user = fields.user;; this.poolId = fields.poolId;; this.withdrawA = fields.withdrawA;; this.withdrawB = fields.withdrawB;; this.feesA = fields.feesA;; this.feesB = fields.feesB;; this.burnLp = fields.burnLp; }

 static reified( ): RedeemResultReified { return { typeName: RedeemResult.$typeName, fullTypeName: composeSuiType( RedeemResult.$typeName, ...[] ) as `${typeof PKG_V1}::pool::RedeemResult`, typeArgs: [ ] as [], isPhantom: RedeemResult.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => RedeemResult.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => RedeemResult.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => RedeemResult.fromBcs( data, ), bcs: RedeemResult.bcs, fromJSONField: (field: any) => RedeemResult.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => RedeemResult.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => RedeemResult.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => RedeemResult.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => RedeemResult.fetch( client, id, ), new: ( fields: RedeemResultFields, ) => { return new RedeemResult( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return RedeemResult.reified() }

 static phantom( ): PhantomReified<ToTypeStr<RedeemResult>> { return phantom(RedeemResult.reified( )); } static get p() { return RedeemResult.phantom() }

 static get bcs() { return bcs.struct("RedeemResult", {

 user: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), pool_id: ID.bcs, withdraw_a: bcs.u64(), withdraw_b: bcs.u64(), fees_a: bcs.u64(), fees_b: bcs.u64(), burn_lp: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): RedeemResult { return RedeemResult.reified( ).new( { user: decodeFromFields("address", fields.user), poolId: decodeFromFields(ID.reified(), fields.pool_id), withdrawA: decodeFromFields("u64", fields.withdraw_a), withdrawB: decodeFromFields("u64", fields.withdraw_b), feesA: decodeFromFields("u64", fields.fees_a), feesB: decodeFromFields("u64", fields.fees_b), burnLp: decodeFromFields("u64", fields.burn_lp) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): RedeemResult { if (!isRedeemResult(item.type)) { throw new Error("not a RedeemResult type");

 }

 return RedeemResult.reified( ).new( { user: decodeFromFieldsWithTypes("address", item.fields.user), poolId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_id), withdrawA: decodeFromFieldsWithTypes("u64", item.fields.withdraw_a), withdrawB: decodeFromFieldsWithTypes("u64", item.fields.withdraw_b), feesA: decodeFromFieldsWithTypes("u64", item.fields.fees_a), feesB: decodeFromFieldsWithTypes("u64", item.fields.fees_b), burnLp: decodeFromFieldsWithTypes("u64", item.fields.burn_lp) } ) }

 static fromBcs( data: Uint8Array ): RedeemResult { return RedeemResult.fromFields( RedeemResult.bcs.parse(data) ) }

 toJSONField() { return {

 user: this.user,poolId: this.poolId,withdrawA: this.withdrawA.toString(),withdrawB: this.withdrawB.toString(),feesA: this.feesA.toString(),feesB: this.feesB.toString(),burnLp: this.burnLp.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): RedeemResult { return RedeemResult.reified( ).new( { user: decodeFromJSONField("address", field.user), poolId: decodeFromJSONField(ID.reified(), field.poolId), withdrawA: decodeFromJSONField("u64", field.withdrawA), withdrawB: decodeFromJSONField("u64", field.withdrawB), feesA: decodeFromJSONField("u64", field.feesA), feesB: decodeFromJSONField("u64", field.feesB), burnLp: decodeFromJSONField("u64", field.burnLp) } ) }

 static fromJSON( json: Record<string, any> ): RedeemResult { if (json.$typeName !== RedeemResult.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return RedeemResult.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): RedeemResult { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isRedeemResult(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a RedeemResult object`); } return RedeemResult.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): RedeemResult { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isRedeemResult(data.bcs.type)) { throw new Error(`object at is not a RedeemResult object`); }

 return RedeemResult.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return RedeemResult.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<RedeemResult> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching RedeemResult object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isRedeemResult(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a RedeemResult object`); }

 return RedeemResult.fromSuiObjectData( res.data ); }

 }

/* ============================== SwapResult =============================== */

export function isSwapResult(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::pool::SwapResult`; }

export interface SwapResultFields { user: ToField<"address">; poolId: ToField<ID>; amountIn: ToField<"u64">; amountOut: ToField<"u64">; outputFees: ToField<SwapFee>; a2B: ToField<"bool"> }

export type SwapResultReified = Reified< SwapResult, SwapResultFields >;

export class SwapResult implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::SwapResult`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = SwapResult.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::SwapResult`; readonly $typeArgs: []; readonly $isPhantom = SwapResult.$isPhantom;

 readonly user: ToField<"address">; readonly poolId: ToField<ID>; readonly amountIn: ToField<"u64">; readonly amountOut: ToField<"u64">; readonly outputFees: ToField<SwapFee>; readonly a2B: ToField<"bool">

 private constructor(typeArgs: [], fields: SwapResultFields, ) { this.$fullTypeName = composeSuiType( SwapResult.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::SwapResult`; this.$typeArgs = typeArgs;

 this.user = fields.user;; this.poolId = fields.poolId;; this.amountIn = fields.amountIn;; this.amountOut = fields.amountOut;; this.outputFees = fields.outputFees;; this.a2B = fields.a2B; }

 static reified( ): SwapResultReified { return { typeName: SwapResult.$typeName, fullTypeName: composeSuiType( SwapResult.$typeName, ...[] ) as `${typeof PKG_V1}::pool::SwapResult`, typeArgs: [ ] as [], isPhantom: SwapResult.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => SwapResult.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => SwapResult.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => SwapResult.fromBcs( data, ), bcs: SwapResult.bcs, fromJSONField: (field: any) => SwapResult.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => SwapResult.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => SwapResult.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => SwapResult.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => SwapResult.fetch( client, id, ), new: ( fields: SwapResultFields, ) => { return new SwapResult( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return SwapResult.reified() }

 static phantom( ): PhantomReified<ToTypeStr<SwapResult>> { return phantom(SwapResult.reified( )); } static get p() { return SwapResult.phantom() }

 static get bcs() { return bcs.struct("SwapResult", {

 user: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), pool_id: ID.bcs, amount_in: bcs.u64(), amount_out: bcs.u64(), output_fees: SwapFee.bcs, a2b: bcs.bool()

}) };

 static fromFields( fields: Record<string, any> ): SwapResult { return SwapResult.reified( ).new( { user: decodeFromFields("address", fields.user), poolId: decodeFromFields(ID.reified(), fields.pool_id), amountIn: decodeFromFields("u64", fields.amount_in), amountOut: decodeFromFields("u64", fields.amount_out), outputFees: decodeFromFields(SwapFee.reified(), fields.output_fees), a2B: decodeFromFields("bool", fields.a2b) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): SwapResult { if (!isSwapResult(item.type)) { throw new Error("not a SwapResult type");

 }

 return SwapResult.reified( ).new( { user: decodeFromFieldsWithTypes("address", item.fields.user), poolId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_id), amountIn: decodeFromFieldsWithTypes("u64", item.fields.amount_in), amountOut: decodeFromFieldsWithTypes("u64", item.fields.amount_out), outputFees: decodeFromFieldsWithTypes(SwapFee.reified(), item.fields.output_fees), a2B: decodeFromFieldsWithTypes("bool", item.fields.a2b) } ) }

 static fromBcs( data: Uint8Array ): SwapResult { return SwapResult.fromFields( SwapResult.bcs.parse(data) ) }

 toJSONField() { return {

 user: this.user,poolId: this.poolId,amountIn: this.amountIn.toString(),amountOut: this.amountOut.toString(),outputFees: this.outputFees.toJSONField(),a2B: this.a2B,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): SwapResult { return SwapResult.reified( ).new( { user: decodeFromJSONField("address", field.user), poolId: decodeFromJSONField(ID.reified(), field.poolId), amountIn: decodeFromJSONField("u64", field.amountIn), amountOut: decodeFromJSONField("u64", field.amountOut), outputFees: decodeFromJSONField(SwapFee.reified(), field.outputFees), a2B: decodeFromJSONField("bool", field.a2B) } ) }

 static fromJSON( json: Record<string, any> ): SwapResult { if (json.$typeName !== SwapResult.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return SwapResult.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): SwapResult { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isSwapResult(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a SwapResult object`); } return SwapResult.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): SwapResult { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isSwapResult(data.bcs.type)) { throw new Error(`object at is not a SwapResult object`); }

 return SwapResult.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return SwapResult.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<SwapResult> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching SwapResult object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isSwapResult(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a SwapResult object`); }

 return SwapResult.fromSuiObjectData( res.data ); }

 }

/* ============================== TradingData =============================== */

export function isTradingData(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::pool::TradingData`; }

export interface TradingDataFields { swapAInAmount: ToField<"u128">; swapBOutAmount: ToField<"u128">; swapAOutAmount: ToField<"u128">; swapBInAmount: ToField<"u128">; protocolFeesA: ToField<"u64">; protocolFeesB: ToField<"u64">; redemptionFeesA: ToField<"u64">; redemptionFeesB: ToField<"u64">; poolFeesA: ToField<"u64">; poolFeesB: ToField<"u64"> }

export type TradingDataReified = Reified< TradingData, TradingDataFields >;

export class TradingData implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::pool::TradingData`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = TradingData.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::pool::TradingData`; readonly $typeArgs: []; readonly $isPhantom = TradingData.$isPhantom;

 readonly swapAInAmount: ToField<"u128">; readonly swapBOutAmount: ToField<"u128">; readonly swapAOutAmount: ToField<"u128">; readonly swapBInAmount: ToField<"u128">; readonly protocolFeesA: ToField<"u64">; readonly protocolFeesB: ToField<"u64">; readonly redemptionFeesA: ToField<"u64">; readonly redemptionFeesB: ToField<"u64">; readonly poolFeesA: ToField<"u64">; readonly poolFeesB: ToField<"u64">

 private constructor(typeArgs: [], fields: TradingDataFields, ) { this.$fullTypeName = composeSuiType( TradingData.$typeName, ...typeArgs ) as `${typeof PKG_V1}::pool::TradingData`; this.$typeArgs = typeArgs;

 this.swapAInAmount = fields.swapAInAmount;; this.swapBOutAmount = fields.swapBOutAmount;; this.swapAOutAmount = fields.swapAOutAmount;; this.swapBInAmount = fields.swapBInAmount;; this.protocolFeesA = fields.protocolFeesA;; this.protocolFeesB = fields.protocolFeesB;; this.redemptionFeesA = fields.redemptionFeesA;; this.redemptionFeesB = fields.redemptionFeesB;; this.poolFeesA = fields.poolFeesA;; this.poolFeesB = fields.poolFeesB; }

 static reified( ): TradingDataReified { return { typeName: TradingData.$typeName, fullTypeName: composeSuiType( TradingData.$typeName, ...[] ) as `${typeof PKG_V1}::pool::TradingData`, typeArgs: [ ] as [], isPhantom: TradingData.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => TradingData.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => TradingData.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => TradingData.fromBcs( data, ), bcs: TradingData.bcs, fromJSONField: (field: any) => TradingData.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => TradingData.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => TradingData.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => TradingData.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => TradingData.fetch( client, id, ), new: ( fields: TradingDataFields, ) => { return new TradingData( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return TradingData.reified() }

 static phantom( ): PhantomReified<ToTypeStr<TradingData>> { return phantom(TradingData.reified( )); } static get p() { return TradingData.phantom() }

 static get bcs() { return bcs.struct("TradingData", {

 swap_a_in_amount: bcs.u128(), swap_b_out_amount: bcs.u128(), swap_a_out_amount: bcs.u128(), swap_b_in_amount: bcs.u128(), protocol_fees_a: bcs.u64(), protocol_fees_b: bcs.u64(), redemption_fees_a: bcs.u64(), redemption_fees_b: bcs.u64(), pool_fees_a: bcs.u64(), pool_fees_b: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): TradingData { return TradingData.reified( ).new( { swapAInAmount: decodeFromFields("u128", fields.swap_a_in_amount), swapBOutAmount: decodeFromFields("u128", fields.swap_b_out_amount), swapAOutAmount: decodeFromFields("u128", fields.swap_a_out_amount), swapBInAmount: decodeFromFields("u128", fields.swap_b_in_amount), protocolFeesA: decodeFromFields("u64", fields.protocol_fees_a), protocolFeesB: decodeFromFields("u64", fields.protocol_fees_b), redemptionFeesA: decodeFromFields("u64", fields.redemption_fees_a), redemptionFeesB: decodeFromFields("u64", fields.redemption_fees_b), poolFeesA: decodeFromFields("u64", fields.pool_fees_a), poolFeesB: decodeFromFields("u64", fields.pool_fees_b) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): TradingData { if (!isTradingData(item.type)) { throw new Error("not a TradingData type");

 }

 return TradingData.reified( ).new( { swapAInAmount: decodeFromFieldsWithTypes("u128", item.fields.swap_a_in_amount), swapBOutAmount: decodeFromFieldsWithTypes("u128", item.fields.swap_b_out_amount), swapAOutAmount: decodeFromFieldsWithTypes("u128", item.fields.swap_a_out_amount), swapBInAmount: decodeFromFieldsWithTypes("u128", item.fields.swap_b_in_amount), protocolFeesA: decodeFromFieldsWithTypes("u64", item.fields.protocol_fees_a), protocolFeesB: decodeFromFieldsWithTypes("u64", item.fields.protocol_fees_b), redemptionFeesA: decodeFromFieldsWithTypes("u64", item.fields.redemption_fees_a), redemptionFeesB: decodeFromFieldsWithTypes("u64", item.fields.redemption_fees_b), poolFeesA: decodeFromFieldsWithTypes("u64", item.fields.pool_fees_a), poolFeesB: decodeFromFieldsWithTypes("u64", item.fields.pool_fees_b) } ) }

 static fromBcs( data: Uint8Array ): TradingData { return TradingData.fromFields( TradingData.bcs.parse(data) ) }

 toJSONField() { return {

 swapAInAmount: this.swapAInAmount.toString(),swapBOutAmount: this.swapBOutAmount.toString(),swapAOutAmount: this.swapAOutAmount.toString(),swapBInAmount: this.swapBInAmount.toString(),protocolFeesA: this.protocolFeesA.toString(),protocolFeesB: this.protocolFeesB.toString(),redemptionFeesA: this.redemptionFeesA.toString(),redemptionFeesB: this.redemptionFeesB.toString(),poolFeesA: this.poolFeesA.toString(),poolFeesB: this.poolFeesB.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): TradingData { return TradingData.reified( ).new( { swapAInAmount: decodeFromJSONField("u128", field.swapAInAmount), swapBOutAmount: decodeFromJSONField("u128", field.swapBOutAmount), swapAOutAmount: decodeFromJSONField("u128", field.swapAOutAmount), swapBInAmount: decodeFromJSONField("u128", field.swapBInAmount), protocolFeesA: decodeFromJSONField("u64", field.protocolFeesA), protocolFeesB: decodeFromJSONField("u64", field.protocolFeesB), redemptionFeesA: decodeFromJSONField("u64", field.redemptionFeesA), redemptionFeesB: decodeFromJSONField("u64", field.redemptionFeesB), poolFeesA: decodeFromJSONField("u64", field.poolFeesA), poolFeesB: decodeFromJSONField("u64", field.poolFeesB) } ) }

 static fromJSON( json: Record<string, any> ): TradingData { if (json.$typeName !== TradingData.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return TradingData.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): TradingData { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isTradingData(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a TradingData object`); } return TradingData.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): TradingData { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isTradingData(data.bcs.type)) { throw new Error(`object at is not a TradingData object`); }

 return TradingData.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return TradingData.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<TradingData> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching TradingData object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isTradingData(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a TradingData object`); }

 return TradingData.fromSuiObjectData( res.data ); }

 }
