import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../_framework/util";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== OracleDecimal =============================== */

export function isOracleDecimal(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle_decimal::OracleDecimal`; }

export interface OracleDecimalFields { base: ToField<"u128">; expo: ToField<"u64">; isExpoNegative: ToField<"bool"> }

export type OracleDecimalReified = Reified< OracleDecimal, OracleDecimalFields >;

export class OracleDecimal implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle_decimal::OracleDecimal`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = OracleDecimal.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle_decimal::OracleDecimal`; readonly $typeArgs: []; readonly $isPhantom = OracleDecimal.$isPhantom;

 readonly base: ToField<"u128">; readonly expo: ToField<"u64">; readonly isExpoNegative: ToField<"bool">

 private constructor(typeArgs: [], fields: OracleDecimalFields, ) { this.$fullTypeName = composeSuiType( OracleDecimal.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle_decimal::OracleDecimal`; this.$typeArgs = typeArgs;

 this.base = fields.base;; this.expo = fields.expo;; this.isExpoNegative = fields.isExpoNegative; }

 static reified( ): OracleDecimalReified { return { typeName: OracleDecimal.$typeName, fullTypeName: composeSuiType( OracleDecimal.$typeName, ...[] ) as `${typeof PKG_V1}::oracle_decimal::OracleDecimal`, typeArgs: [ ] as [], isPhantom: OracleDecimal.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => OracleDecimal.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => OracleDecimal.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => OracleDecimal.fromBcs( data, ), bcs: OracleDecimal.bcs, fromJSONField: (field: any) => OracleDecimal.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => OracleDecimal.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => OracleDecimal.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => OracleDecimal.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => OracleDecimal.fetch( client, id, ), new: ( fields: OracleDecimalFields, ) => { return new OracleDecimal( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return OracleDecimal.reified() }

 static phantom( ): PhantomReified<ToTypeStr<OracleDecimal>> { return phantom(OracleDecimal.reified( )); } static get p() { return OracleDecimal.phantom() }

 static get bcs() { return bcs.struct("OracleDecimal", {

 base: bcs.u128(), expo: bcs.u64(), is_expo_negative: bcs.bool()

}) };

 static fromFields( fields: Record<string, any> ): OracleDecimal { return OracleDecimal.reified( ).new( { base: decodeFromFields("u128", fields.base), expo: decodeFromFields("u64", fields.expo), isExpoNegative: decodeFromFields("bool", fields.is_expo_negative) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): OracleDecimal { if (!isOracleDecimal(item.type)) { throw new Error("not a OracleDecimal type");

 }

 return OracleDecimal.reified( ).new( { base: decodeFromFieldsWithTypes("u128", item.fields.base), expo: decodeFromFieldsWithTypes("u64", item.fields.expo), isExpoNegative: decodeFromFieldsWithTypes("bool", item.fields.is_expo_negative) } ) }

 static fromBcs( data: Uint8Array ): OracleDecimal { return OracleDecimal.fromFields( OracleDecimal.bcs.parse(data) ) }

 toJSONField() { return {

 base: this.base.toString(),expo: this.expo.toString(),isExpoNegative: this.isExpoNegative,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): OracleDecimal { return OracleDecimal.reified( ).new( { base: decodeFromJSONField("u128", field.base), expo: decodeFromJSONField("u64", field.expo), isExpoNegative: decodeFromJSONField("bool", field.isExpoNegative) } ) }

 static fromJSON( json: Record<string, any> ): OracleDecimal { if (json.$typeName !== OracleDecimal.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return OracleDecimal.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): OracleDecimal { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isOracleDecimal(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a OracleDecimal object`); } return OracleDecimal.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): OracleDecimal { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isOracleDecimal(data.bcs.type)) { throw new Error(`object at is not a OracleDecimal object`); }

 return OracleDecimal.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return OracleDecimal.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<OracleDecimal> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching OracleDecimal object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isOracleDecimal(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a OracleDecimal object`); }

 return OracleDecimal.fromSuiObjectData( res.data ); }

 }
