import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {Decimal} from "../decimal/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== AggregatorUpdated =============================== */

export function isAggregatorUpdated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator_submit_result_action::AggregatorUpdated`; }

export interface AggregatorUpdatedFields { aggregatorId: ToField<ID>; oracleId: ToField<ID>; value: ToField<Decimal>; timestampMs: ToField<"u64"> }

export type AggregatorUpdatedReified = Reified< AggregatorUpdated, AggregatorUpdatedFields >;

export class AggregatorUpdated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator_submit_result_action::AggregatorUpdated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AggregatorUpdated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator_submit_result_action::AggregatorUpdated`; readonly $typeArgs: []; readonly $isPhantom = AggregatorUpdated.$isPhantom;

 readonly aggregatorId: ToField<ID>; readonly oracleId: ToField<ID>; readonly value: ToField<Decimal>; readonly timestampMs: ToField<"u64">

 private constructor(typeArgs: [], fields: AggregatorUpdatedFields, ) { this.$fullTypeName = composeSuiType( AggregatorUpdated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator_submit_result_action::AggregatorUpdated`; this.$typeArgs = typeArgs;

 this.aggregatorId = fields.aggregatorId;; this.oracleId = fields.oracleId;; this.value = fields.value;; this.timestampMs = fields.timestampMs; }

 static reified( ): AggregatorUpdatedReified { return { typeName: AggregatorUpdated.$typeName, fullTypeName: composeSuiType( AggregatorUpdated.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator_submit_result_action::AggregatorUpdated`, typeArgs: [ ] as [], isPhantom: AggregatorUpdated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AggregatorUpdated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AggregatorUpdated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AggregatorUpdated.fromBcs( data, ), bcs: AggregatorUpdated.bcs, fromJSONField: (field: any) => AggregatorUpdated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AggregatorUpdated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AggregatorUpdated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AggregatorUpdated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AggregatorUpdated.fetch( client, id, ), new: ( fields: AggregatorUpdatedFields, ) => { return new AggregatorUpdated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AggregatorUpdated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AggregatorUpdated>> { return phantom(AggregatorUpdated.reified( )); } static get p() { return AggregatorUpdated.phantom() }

 static get bcs() { return bcs.struct("AggregatorUpdated", {

 aggregatorId: ID.bcs, oracleId: ID.bcs, value: Decimal.bcs, timestampMs: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): AggregatorUpdated { return AggregatorUpdated.reified( ).new( { aggregatorId: decodeFromFields(ID.reified(), fields.aggregatorId), oracleId: decodeFromFields(ID.reified(), fields.oracleId), value: decodeFromFields(Decimal.reified(), fields.value), timestampMs: decodeFromFields("u64", fields.timestampMs) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AggregatorUpdated { if (!isAggregatorUpdated(item.type)) { throw new Error("not a AggregatorUpdated type");

 }

 return AggregatorUpdated.reified( ).new( { aggregatorId: decodeFromFieldsWithTypes(ID.reified(), item.fields.aggregatorId), oracleId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleId), value: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.value), timestampMs: decodeFromFieldsWithTypes("u64", item.fields.timestampMs) } ) }

 static fromBcs( data: Uint8Array ): AggregatorUpdated { return AggregatorUpdated.fromFields( AggregatorUpdated.bcs.parse(data) ) }

 toJSONField() { return {

 aggregatorId: this.aggregatorId,oracleId: this.oracleId,value: this.value.toJSONField(),timestampMs: this.timestampMs.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AggregatorUpdated { return AggregatorUpdated.reified( ).new( { aggregatorId: decodeFromJSONField(ID.reified(), field.aggregatorId), oracleId: decodeFromJSONField(ID.reified(), field.oracleId), value: decodeFromJSONField(Decimal.reified(), field.value), timestampMs: decodeFromJSONField("u64", field.timestampMs) } ) }

 static fromJSON( json: Record<string, any> ): AggregatorUpdated { if (json.$typeName !== AggregatorUpdated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AggregatorUpdated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AggregatorUpdated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAggregatorUpdated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AggregatorUpdated object`); } return AggregatorUpdated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AggregatorUpdated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAggregatorUpdated(data.bcs.type)) { throw new Error(`object at is not a AggregatorUpdated object`); }

 return AggregatorUpdated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AggregatorUpdated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AggregatorUpdated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AggregatorUpdated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAggregatorUpdated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AggregatorUpdated object`); }

 return AggregatorUpdated.fromSuiObjectData( res.data ); }

 }
