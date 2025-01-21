import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../_framework/util";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== DepositQuote =============================== */

export function isDepositQuote(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::quote::DepositQuote`; }

export interface DepositQuoteFields { initialDeposit: ToField<"bool">; depositA: ToField<"u64">; depositB: ToField<"u64">; mintLp: ToField<"u64"> }

export type DepositQuoteReified = Reified< DepositQuote, DepositQuoteFields >;

export class DepositQuote implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::quote::DepositQuote`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = DepositQuote.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::quote::DepositQuote`; readonly $typeArgs: []; readonly $isPhantom = DepositQuote.$isPhantom;

 readonly initialDeposit: ToField<"bool">; readonly depositA: ToField<"u64">; readonly depositB: ToField<"u64">; readonly mintLp: ToField<"u64">

 private constructor(typeArgs: [], fields: DepositQuoteFields, ) { this.$fullTypeName = composeSuiType( DepositQuote.$typeName, ...typeArgs ) as `${typeof PKG_V1}::quote::DepositQuote`; this.$typeArgs = typeArgs;

 this.initialDeposit = fields.initialDeposit;; this.depositA = fields.depositA;; this.depositB = fields.depositB;; this.mintLp = fields.mintLp; }

 static reified( ): DepositQuoteReified { return { typeName: DepositQuote.$typeName, fullTypeName: composeSuiType( DepositQuote.$typeName, ...[] ) as `${typeof PKG_V1}::quote::DepositQuote`, typeArgs: [ ] as [], isPhantom: DepositQuote.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => DepositQuote.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => DepositQuote.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => DepositQuote.fromBcs( data, ), bcs: DepositQuote.bcs, fromJSONField: (field: any) => DepositQuote.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => DepositQuote.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => DepositQuote.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => DepositQuote.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => DepositQuote.fetch( client, id, ), new: ( fields: DepositQuoteFields, ) => { return new DepositQuote( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return DepositQuote.reified() }

 static phantom( ): PhantomReified<ToTypeStr<DepositQuote>> { return phantom(DepositQuote.reified( )); } static get p() { return DepositQuote.phantom() }

 static get bcs() { return bcs.struct("DepositQuote", {

 initial_deposit: bcs.bool(), deposit_a: bcs.u64(), deposit_b: bcs.u64(), mint_lp: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): DepositQuote { return DepositQuote.reified( ).new( { initialDeposit: decodeFromFields("bool", fields.initial_deposit), depositA: decodeFromFields("u64", fields.deposit_a), depositB: decodeFromFields("u64", fields.deposit_b), mintLp: decodeFromFields("u64", fields.mint_lp) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): DepositQuote { if (!isDepositQuote(item.type)) { throw new Error("not a DepositQuote type");

 }

 return DepositQuote.reified( ).new( { initialDeposit: decodeFromFieldsWithTypes("bool", item.fields.initial_deposit), depositA: decodeFromFieldsWithTypes("u64", item.fields.deposit_a), depositB: decodeFromFieldsWithTypes("u64", item.fields.deposit_b), mintLp: decodeFromFieldsWithTypes("u64", item.fields.mint_lp) } ) }

 static fromBcs( data: Uint8Array ): DepositQuote { return DepositQuote.fromFields( DepositQuote.bcs.parse(data) ) }

 toJSONField() { return {

 initialDeposit: this.initialDeposit,depositA: this.depositA.toString(),depositB: this.depositB.toString(),mintLp: this.mintLp.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): DepositQuote { return DepositQuote.reified( ).new( { initialDeposit: decodeFromJSONField("bool", field.initialDeposit), depositA: decodeFromJSONField("u64", field.depositA), depositB: decodeFromJSONField("u64", field.depositB), mintLp: decodeFromJSONField("u64", field.mintLp) } ) }

 static fromJSON( json: Record<string, any> ): DepositQuote { if (json.$typeName !== DepositQuote.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return DepositQuote.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): DepositQuote { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isDepositQuote(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a DepositQuote object`); } return DepositQuote.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): DepositQuote { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isDepositQuote(data.bcs.type)) { throw new Error(`object at is not a DepositQuote object`); }

 return DepositQuote.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return DepositQuote.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<DepositQuote> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching DepositQuote object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isDepositQuote(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a DepositQuote object`); }

 return DepositQuote.fromSuiObjectData( res.data ); }

 }

/* ============================== RedeemQuote =============================== */

export function isRedeemQuote(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::quote::RedeemQuote`; }

export interface RedeemQuoteFields { withdrawA: ToField<"u64">; withdrawB: ToField<"u64">; feesA: ToField<"u64">; feesB: ToField<"u64">; burnLp: ToField<"u64"> }

export type RedeemQuoteReified = Reified< RedeemQuote, RedeemQuoteFields >;

export class RedeemQuote implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::quote::RedeemQuote`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = RedeemQuote.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::quote::RedeemQuote`; readonly $typeArgs: []; readonly $isPhantom = RedeemQuote.$isPhantom;

 readonly withdrawA: ToField<"u64">; readonly withdrawB: ToField<"u64">; readonly feesA: ToField<"u64">; readonly feesB: ToField<"u64">; readonly burnLp: ToField<"u64">

 private constructor(typeArgs: [], fields: RedeemQuoteFields, ) { this.$fullTypeName = composeSuiType( RedeemQuote.$typeName, ...typeArgs ) as `${typeof PKG_V1}::quote::RedeemQuote`; this.$typeArgs = typeArgs;

 this.withdrawA = fields.withdrawA;; this.withdrawB = fields.withdrawB;; this.feesA = fields.feesA;; this.feesB = fields.feesB;; this.burnLp = fields.burnLp; }

 static reified( ): RedeemQuoteReified { return { typeName: RedeemQuote.$typeName, fullTypeName: composeSuiType( RedeemQuote.$typeName, ...[] ) as `${typeof PKG_V1}::quote::RedeemQuote`, typeArgs: [ ] as [], isPhantom: RedeemQuote.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => RedeemQuote.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => RedeemQuote.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => RedeemQuote.fromBcs( data, ), bcs: RedeemQuote.bcs, fromJSONField: (field: any) => RedeemQuote.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => RedeemQuote.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => RedeemQuote.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => RedeemQuote.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => RedeemQuote.fetch( client, id, ), new: ( fields: RedeemQuoteFields, ) => { return new RedeemQuote( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return RedeemQuote.reified() }

 static phantom( ): PhantomReified<ToTypeStr<RedeemQuote>> { return phantom(RedeemQuote.reified( )); } static get p() { return RedeemQuote.phantom() }

 static get bcs() { return bcs.struct("RedeemQuote", {

 withdraw_a: bcs.u64(), withdraw_b: bcs.u64(), fees_a: bcs.u64(), fees_b: bcs.u64(), burn_lp: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): RedeemQuote { return RedeemQuote.reified( ).new( { withdrawA: decodeFromFields("u64", fields.withdraw_a), withdrawB: decodeFromFields("u64", fields.withdraw_b), feesA: decodeFromFields("u64", fields.fees_a), feesB: decodeFromFields("u64", fields.fees_b), burnLp: decodeFromFields("u64", fields.burn_lp) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): RedeemQuote { if (!isRedeemQuote(item.type)) { throw new Error("not a RedeemQuote type");

 }

 return RedeemQuote.reified( ).new( { withdrawA: decodeFromFieldsWithTypes("u64", item.fields.withdraw_a), withdrawB: decodeFromFieldsWithTypes("u64", item.fields.withdraw_b), feesA: decodeFromFieldsWithTypes("u64", item.fields.fees_a), feesB: decodeFromFieldsWithTypes("u64", item.fields.fees_b), burnLp: decodeFromFieldsWithTypes("u64", item.fields.burn_lp) } ) }

 static fromBcs( data: Uint8Array ): RedeemQuote { return RedeemQuote.fromFields( RedeemQuote.bcs.parse(data) ) }

 toJSONField() { return {

 withdrawA: this.withdrawA.toString(),withdrawB: this.withdrawB.toString(),feesA: this.feesA.toString(),feesB: this.feesB.toString(),burnLp: this.burnLp.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): RedeemQuote { return RedeemQuote.reified( ).new( { withdrawA: decodeFromJSONField("u64", field.withdrawA), withdrawB: decodeFromJSONField("u64", field.withdrawB), feesA: decodeFromJSONField("u64", field.feesA), feesB: decodeFromJSONField("u64", field.feesB), burnLp: decodeFromJSONField("u64", field.burnLp) } ) }

 static fromJSON( json: Record<string, any> ): RedeemQuote { if (json.$typeName !== RedeemQuote.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return RedeemQuote.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): RedeemQuote { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isRedeemQuote(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a RedeemQuote object`); } return RedeemQuote.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): RedeemQuote { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isRedeemQuote(data.bcs.type)) { throw new Error(`object at is not a RedeemQuote object`); }

 return RedeemQuote.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return RedeemQuote.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<RedeemQuote> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching RedeemQuote object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isRedeemQuote(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a RedeemQuote object`); }

 return RedeemQuote.fromSuiObjectData( res.data ); }

 }

/* ============================== SwapFee =============================== */

export function isSwapFee(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::quote::SwapFee`; }

export interface SwapFeeFields { protocolFees: ToField<"u64">; poolFees: ToField<"u64"> }

export type SwapFeeReified = Reified< SwapFee, SwapFeeFields >;

export class SwapFee implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::quote::SwapFee`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = SwapFee.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::quote::SwapFee`; readonly $typeArgs: []; readonly $isPhantom = SwapFee.$isPhantom;

 readonly protocolFees: ToField<"u64">; readonly poolFees: ToField<"u64">

 private constructor(typeArgs: [], fields: SwapFeeFields, ) { this.$fullTypeName = composeSuiType( SwapFee.$typeName, ...typeArgs ) as `${typeof PKG_V1}::quote::SwapFee`; this.$typeArgs = typeArgs;

 this.protocolFees = fields.protocolFees;; this.poolFees = fields.poolFees; }

 static reified( ): SwapFeeReified { return { typeName: SwapFee.$typeName, fullTypeName: composeSuiType( SwapFee.$typeName, ...[] ) as `${typeof PKG_V1}::quote::SwapFee`, typeArgs: [ ] as [], isPhantom: SwapFee.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => SwapFee.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => SwapFee.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => SwapFee.fromBcs( data, ), bcs: SwapFee.bcs, fromJSONField: (field: any) => SwapFee.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => SwapFee.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => SwapFee.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => SwapFee.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => SwapFee.fetch( client, id, ), new: ( fields: SwapFeeFields, ) => { return new SwapFee( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return SwapFee.reified() }

 static phantom( ): PhantomReified<ToTypeStr<SwapFee>> { return phantom(SwapFee.reified( )); } static get p() { return SwapFee.phantom() }

 static get bcs() { return bcs.struct("SwapFee", {

 protocol_fees: bcs.u64(), pool_fees: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): SwapFee { return SwapFee.reified( ).new( { protocolFees: decodeFromFields("u64", fields.protocol_fees), poolFees: decodeFromFields("u64", fields.pool_fees) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): SwapFee { if (!isSwapFee(item.type)) { throw new Error("not a SwapFee type");

 }

 return SwapFee.reified( ).new( { protocolFees: decodeFromFieldsWithTypes("u64", item.fields.protocol_fees), poolFees: decodeFromFieldsWithTypes("u64", item.fields.pool_fees) } ) }

 static fromBcs( data: Uint8Array ): SwapFee { return SwapFee.fromFields( SwapFee.bcs.parse(data) ) }

 toJSONField() { return {

 protocolFees: this.protocolFees.toString(),poolFees: this.poolFees.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): SwapFee { return SwapFee.reified( ).new( { protocolFees: decodeFromJSONField("u64", field.protocolFees), poolFees: decodeFromJSONField("u64", field.poolFees) } ) }

 static fromJSON( json: Record<string, any> ): SwapFee { if (json.$typeName !== SwapFee.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return SwapFee.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): SwapFee { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isSwapFee(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a SwapFee object`); } return SwapFee.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): SwapFee { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isSwapFee(data.bcs.type)) { throw new Error(`object at is not a SwapFee object`); }

 return SwapFee.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return SwapFee.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<SwapFee> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching SwapFee object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isSwapFee(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a SwapFee object`); }

 return SwapFee.fromSuiObjectData( res.data ); }

 }

/* ============================== SwapQuote =============================== */

export function isSwapQuote(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::quote::SwapQuote`; }

export interface SwapQuoteFields { amountIn: ToField<"u64">; amountOut: ToField<"u64">; outputFees: ToField<SwapFee>; a2B: ToField<"bool"> }

export type SwapQuoteReified = Reified< SwapQuote, SwapQuoteFields >;

export class SwapQuote implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::quote::SwapQuote`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = SwapQuote.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::quote::SwapQuote`; readonly $typeArgs: []; readonly $isPhantom = SwapQuote.$isPhantom;

 readonly amountIn: ToField<"u64">; readonly amountOut: ToField<"u64">; readonly outputFees: ToField<SwapFee>; readonly a2B: ToField<"bool">

 private constructor(typeArgs: [], fields: SwapQuoteFields, ) { this.$fullTypeName = composeSuiType( SwapQuote.$typeName, ...typeArgs ) as `${typeof PKG_V1}::quote::SwapQuote`; this.$typeArgs = typeArgs;

 this.amountIn = fields.amountIn;; this.amountOut = fields.amountOut;; this.outputFees = fields.outputFees;; this.a2B = fields.a2B; }

 static reified( ): SwapQuoteReified { return { typeName: SwapQuote.$typeName, fullTypeName: composeSuiType( SwapQuote.$typeName, ...[] ) as `${typeof PKG_V1}::quote::SwapQuote`, typeArgs: [ ] as [], isPhantom: SwapQuote.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => SwapQuote.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => SwapQuote.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => SwapQuote.fromBcs( data, ), bcs: SwapQuote.bcs, fromJSONField: (field: any) => SwapQuote.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => SwapQuote.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => SwapQuote.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => SwapQuote.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => SwapQuote.fetch( client, id, ), new: ( fields: SwapQuoteFields, ) => { return new SwapQuote( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return SwapQuote.reified() }

 static phantom( ): PhantomReified<ToTypeStr<SwapQuote>> { return phantom(SwapQuote.reified( )); } static get p() { return SwapQuote.phantom() }

 static get bcs() { return bcs.struct("SwapQuote", {

 amount_in: bcs.u64(), amount_out: bcs.u64(), output_fees: SwapFee.bcs, a2b: bcs.bool()

}) };

 static fromFields( fields: Record<string, any> ): SwapQuote { return SwapQuote.reified( ).new( { amountIn: decodeFromFields("u64", fields.amount_in), amountOut: decodeFromFields("u64", fields.amount_out), outputFees: decodeFromFields(SwapFee.reified(), fields.output_fees), a2B: decodeFromFields("bool", fields.a2b) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): SwapQuote { if (!isSwapQuote(item.type)) { throw new Error("not a SwapQuote type");

 }

 return SwapQuote.reified( ).new( { amountIn: decodeFromFieldsWithTypes("u64", item.fields.amount_in), amountOut: decodeFromFieldsWithTypes("u64", item.fields.amount_out), outputFees: decodeFromFieldsWithTypes(SwapFee.reified(), item.fields.output_fees), a2B: decodeFromFieldsWithTypes("bool", item.fields.a2b) } ) }

 static fromBcs( data: Uint8Array ): SwapQuote { return SwapQuote.fromFields( SwapQuote.bcs.parse(data) ) }

 toJSONField() { return {

 amountIn: this.amountIn.toString(),amountOut: this.amountOut.toString(),outputFees: this.outputFees.toJSONField(),a2B: this.a2B,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): SwapQuote { return SwapQuote.reified( ).new( { amountIn: decodeFromJSONField("u64", field.amountIn), amountOut: decodeFromJSONField("u64", field.amountOut), outputFees: decodeFromJSONField(SwapFee.reified(), field.outputFees), a2B: decodeFromJSONField("bool", field.a2B) } ) }

 static fromJSON( json: Record<string, any> ): SwapQuote { if (json.$typeName !== SwapQuote.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return SwapQuote.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): SwapQuote { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isSwapQuote(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a SwapQuote object`); } return SwapQuote.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): SwapQuote { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isSwapQuote(data.bcs.type)) { throw new Error(`object at is not a SwapQuote object`); }

 return SwapQuote.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return SwapQuote.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<SwapQuote> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching SwapQuote object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isSwapQuote(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a SwapQuote object`); }

 return SwapQuote.fromSuiObjectData( res.data ); }

 }
