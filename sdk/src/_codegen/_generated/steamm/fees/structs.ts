import {Balance} from "../../_dependencies/source/0x2/balance/structs";
import {PhantomReified, PhantomToTypeStr, PhantomTypeArgument, Reified, StructClass, ToField, ToPhantomTypeArgument, ToTypeStr, assertFieldsWithTypesArgsMatch, assertReifiedTypeArgsMatch, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, extractType, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType, parseTypeName} from "../../_framework/util";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== FeeConfig =============================== */

export function isFeeConfig(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::fees::FeeConfig`; }

export interface FeeConfigFields { feeNumerator: ToField<"u64">; feeDenominator: ToField<"u64">; minFee: ToField<"u64"> }

export type FeeConfigReified = Reified< FeeConfig, FeeConfigFields >;

export class FeeConfig implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::fees::FeeConfig`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = FeeConfig.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::fees::FeeConfig`; readonly $typeArgs: []; readonly $isPhantom = FeeConfig.$isPhantom;

 readonly feeNumerator: ToField<"u64">; readonly feeDenominator: ToField<"u64">; readonly minFee: ToField<"u64">

 private constructor(typeArgs: [], fields: FeeConfigFields, ) { this.$fullTypeName = composeSuiType( FeeConfig.$typeName, ...typeArgs ) as `${typeof PKG_V1}::fees::FeeConfig`; this.$typeArgs = typeArgs;

 this.feeNumerator = fields.feeNumerator;; this.feeDenominator = fields.feeDenominator;; this.minFee = fields.minFee; }

 static reified( ): FeeConfigReified { return { typeName: FeeConfig.$typeName, fullTypeName: composeSuiType( FeeConfig.$typeName, ...[] ) as `${typeof PKG_V1}::fees::FeeConfig`, typeArgs: [ ] as [], isPhantom: FeeConfig.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => FeeConfig.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => FeeConfig.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => FeeConfig.fromBcs( data, ), bcs: FeeConfig.bcs, fromJSONField: (field: any) => FeeConfig.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => FeeConfig.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => FeeConfig.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => FeeConfig.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => FeeConfig.fetch( client, id, ), new: ( fields: FeeConfigFields, ) => { return new FeeConfig( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return FeeConfig.reified() }

 static phantom( ): PhantomReified<ToTypeStr<FeeConfig>> { return phantom(FeeConfig.reified( )); } static get p() { return FeeConfig.phantom() }

 static get bcs() { return bcs.struct("FeeConfig", {

 fee_numerator: bcs.u64(), fee_denominator: bcs.u64(), min_fee: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): FeeConfig { return FeeConfig.reified( ).new( { feeNumerator: decodeFromFields("u64", fields.fee_numerator), feeDenominator: decodeFromFields("u64", fields.fee_denominator), minFee: decodeFromFields("u64", fields.min_fee) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): FeeConfig { if (!isFeeConfig(item.type)) { throw new Error("not a FeeConfig type");

 }

 return FeeConfig.reified( ).new( { feeNumerator: decodeFromFieldsWithTypes("u64", item.fields.fee_numerator), feeDenominator: decodeFromFieldsWithTypes("u64", item.fields.fee_denominator), minFee: decodeFromFieldsWithTypes("u64", item.fields.min_fee) } ) }

 static fromBcs( data: Uint8Array ): FeeConfig { return FeeConfig.fromFields( FeeConfig.bcs.parse(data) ) }

 toJSONField() { return {

 feeNumerator: this.feeNumerator.toString(),feeDenominator: this.feeDenominator.toString(),minFee: this.minFee.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): FeeConfig { return FeeConfig.reified( ).new( { feeNumerator: decodeFromJSONField("u64", field.feeNumerator), feeDenominator: decodeFromJSONField("u64", field.feeDenominator), minFee: decodeFromJSONField("u64", field.minFee) } ) }

 static fromJSON( json: Record<string, any> ): FeeConfig { if (json.$typeName !== FeeConfig.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return FeeConfig.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): FeeConfig { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isFeeConfig(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a FeeConfig object`); } return FeeConfig.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): FeeConfig { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isFeeConfig(data.bcs.type)) { throw new Error(`object at is not a FeeConfig object`); }

 return FeeConfig.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return FeeConfig.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<FeeConfig> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching FeeConfig object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isFeeConfig(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a FeeConfig object`); }

 return FeeConfig.fromSuiObjectData( res.data ); }

 }

/* ============================== Fees =============================== */

export function isFees(type: string): boolean { type = compressSuiType(type); return type.startsWith(`${PKG_V1}::fees::Fees` + '<'); }

export interface FeesFields<A extends PhantomTypeArgument, B extends PhantomTypeArgument> { config: ToField<FeeConfig>; feeA: ToField<Balance<A>>; feeB: ToField<Balance<B>> }

export type FeesReified<A extends PhantomTypeArgument, B extends PhantomTypeArgument> = Reified< Fees<A, B>, FeesFields<A, B> >;

export class Fees<A extends PhantomTypeArgument, B extends PhantomTypeArgument> implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::fees::Fees`; static readonly $numTypeParams = 2; static readonly $isPhantom = [true,true,] as const;

 readonly $typeName = Fees.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::fees::Fees<${PhantomToTypeStr<A>}, ${PhantomToTypeStr<B>}>`; readonly $typeArgs: [PhantomToTypeStr<A>, PhantomToTypeStr<B>]; readonly $isPhantom = Fees.$isPhantom;

 readonly config: ToField<FeeConfig>; readonly feeA: ToField<Balance<A>>; readonly feeB: ToField<Balance<B>>

 private constructor(typeArgs: [PhantomToTypeStr<A>, PhantomToTypeStr<B>], fields: FeesFields<A, B>, ) { this.$fullTypeName = composeSuiType( Fees.$typeName, ...typeArgs ) as `${typeof PKG_V1}::fees::Fees<${PhantomToTypeStr<A>}, ${PhantomToTypeStr<B>}>`; this.$typeArgs = typeArgs;

 this.config = fields.config;; this.feeA = fields.feeA;; this.feeB = fields.feeB; }

 static reified<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( A: A, B: B ): FeesReified<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { return { typeName: Fees.$typeName, fullTypeName: composeSuiType( Fees.$typeName, ...[extractType(A), extractType(B)] ) as `${typeof PKG_V1}::fees::Fees<${PhantomToTypeStr<ToPhantomTypeArgument<A>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<B>>}>`, typeArgs: [ extractType(A), extractType(B) ] as [PhantomToTypeStr<ToPhantomTypeArgument<A>>, PhantomToTypeStr<ToPhantomTypeArgument<B>>], isPhantom: Fees.$isPhantom, reifiedTypeArgs: [A, B], fromFields: (fields: Record<string, any>) => Fees.fromFields( [A, B], fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Fees.fromFieldsWithTypes( [A, B], item, ), fromBcs: (data: Uint8Array) => Fees.fromBcs( [A, B], data, ), bcs: Fees.bcs, fromJSONField: (field: any) => Fees.fromJSONField( [A, B], field, ), fromJSON: (json: Record<string, any>) => Fees.fromJSON( [A, B], json, ), fromSuiParsedData: (content: SuiParsedData) => Fees.fromSuiParsedData( [A, B], content, ), fromSuiObjectData: (content: SuiObjectData) => Fees.fromSuiObjectData( [A, B], content, ), fetch: async (client: SuiClient, id: string) => Fees.fetch( client, [A, B], id, ), new: ( fields: FeesFields<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>>, ) => { return new Fees( [extractType(A), extractType(B)], fields ) }, kind: "StructClassReified", } }

 static get r() { return Fees.reified }

 static phantom<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( A: A, B: B ): PhantomReified<ToTypeStr<Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>>>> { return phantom(Fees.reified( A, B )); } static get p() { return Fees.phantom }

 static get bcs() { return bcs.struct("Fees", {

 config: FeeConfig.bcs, fee_a: Balance.bcs, fee_b: Balance.bcs

}) };

 static fromFields<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], fields: Record<string, any> ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { return Fees.reified( typeArgs[0], typeArgs[1], ).new( { config: decodeFromFields(FeeConfig.reified(), fields.config), feeA: decodeFromFields(Balance.reified(typeArgs[0]), fields.fee_a), feeB: decodeFromFields(Balance.reified(typeArgs[1]), fields.fee_b) } ) }

 static fromFieldsWithTypes<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], item: FieldsWithTypes ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { if (!isFees(item.type)) { throw new Error("not a Fees type");

 } assertFieldsWithTypesArgsMatch(item, typeArgs);

 return Fees.reified( typeArgs[0], typeArgs[1], ).new( { config: decodeFromFieldsWithTypes(FeeConfig.reified(), item.fields.config), feeA: decodeFromFieldsWithTypes(Balance.reified(typeArgs[0]), item.fields.fee_a), feeB: decodeFromFieldsWithTypes(Balance.reified(typeArgs[1]), item.fields.fee_b) } ) }

 static fromBcs<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], data: Uint8Array ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { return Fees.fromFields( typeArgs, Fees.bcs.parse(data) ) }

 toJSONField() { return {

 config: this.config.toJSONField(),feeA: this.feeA.toJSONField(),feeB: this.feeB.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], field: any ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { return Fees.reified( typeArgs[0], typeArgs[1], ).new( { config: decodeFromJSONField(FeeConfig.reified(), field.config), feeA: decodeFromJSONField(Balance.reified(typeArgs[0]), field.feeA), feeB: decodeFromJSONField(Balance.reified(typeArgs[1]), field.feeB) } ) }

 static fromJSON<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], json: Record<string, any> ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { if (json.$typeName !== Fees.$typeName) { throw new Error("not a WithTwoGenerics json object") }; assertReifiedTypeArgsMatch( composeSuiType(Fees.$typeName, ...typeArgs.map(extractType)), json.$typeArgs, typeArgs, )

 return Fees.fromJSONField( typeArgs, json, ) }

 static fromSuiParsedData<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], content: SuiParsedData ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isFees(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Fees object`); } return Fees.fromFieldsWithTypes( typeArgs, content ); }

 static fromSuiObjectData<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( typeArgs: [A, B], data: SuiObjectData ): Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>> { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isFees(data.bcs.type)) { throw new Error(`object at is not a Fees object`); }

 const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs; if (gotTypeArgs.length !== 2) { throw new Error(`type argument mismatch: expected 2 type arguments but got ${gotTypeArgs.length}`); }; for (let i = 0; i < 2; i++) { const gotTypeArg = compressSuiType(gotTypeArgs[i]); const expectedTypeArg = compressSuiType(extractType(typeArgs[i])); if (gotTypeArg !== expectedTypeArg) { throw new Error(`type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`); } };

 return Fees.fromBcs( typeArgs, fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Fees.fromSuiParsedData( typeArgs, data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch<A extends PhantomReified<PhantomTypeArgument>, B extends PhantomReified<PhantomTypeArgument>>( client: SuiClient, typeArgs: [A, B], id: string ): Promise<Fees<ToPhantomTypeArgument<A>, ToPhantomTypeArgument<B>>> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Fees object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isFees(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Fees object`); }

 return Fees.fromSuiObjectData( typeArgs, res.data ); }

 }
