import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== AggregatorConfigsUpdated =============================== */

export function isAggregatorConfigsUpdated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator_set_configs_action::AggregatorConfigsUpdated`; }

export interface AggregatorConfigsUpdatedFields { aggregatorId: ToField<ID>; feedHash: ToField<Vector<"u8">>; minSampleSize: ToField<"u64">; maxStalenessSeconds: ToField<"u64">; maxVariance: ToField<"u64">; minResponses: ToField<"u32"> }

export type AggregatorConfigsUpdatedReified = Reified< AggregatorConfigsUpdated, AggregatorConfigsUpdatedFields >;

export class AggregatorConfigsUpdated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator_set_configs_action::AggregatorConfigsUpdated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AggregatorConfigsUpdated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator_set_configs_action::AggregatorConfigsUpdated`; readonly $typeArgs: []; readonly $isPhantom = AggregatorConfigsUpdated.$isPhantom;

 readonly aggregatorId: ToField<ID>; readonly feedHash: ToField<Vector<"u8">>; readonly minSampleSize: ToField<"u64">; readonly maxStalenessSeconds: ToField<"u64">; readonly maxVariance: ToField<"u64">; readonly minResponses: ToField<"u32">

 private constructor(typeArgs: [], fields: AggregatorConfigsUpdatedFields, ) { this.$fullTypeName = composeSuiType( AggregatorConfigsUpdated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator_set_configs_action::AggregatorConfigsUpdated`; this.$typeArgs = typeArgs;

 this.aggregatorId = fields.aggregatorId;; this.feedHash = fields.feedHash;; this.minSampleSize = fields.minSampleSize;; this.maxStalenessSeconds = fields.maxStalenessSeconds;; this.maxVariance = fields.maxVariance;; this.minResponses = fields.minResponses; }

 static reified( ): AggregatorConfigsUpdatedReified { return { typeName: AggregatorConfigsUpdated.$typeName, fullTypeName: composeSuiType( AggregatorConfigsUpdated.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator_set_configs_action::AggregatorConfigsUpdated`, typeArgs: [ ] as [], isPhantom: AggregatorConfigsUpdated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AggregatorConfigsUpdated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AggregatorConfigsUpdated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AggregatorConfigsUpdated.fromBcs( data, ), bcs: AggregatorConfigsUpdated.bcs, fromJSONField: (field: any) => AggregatorConfigsUpdated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AggregatorConfigsUpdated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AggregatorConfigsUpdated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AggregatorConfigsUpdated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AggregatorConfigsUpdated.fetch( client, id, ), new: ( fields: AggregatorConfigsUpdatedFields, ) => { return new AggregatorConfigsUpdated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AggregatorConfigsUpdated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AggregatorConfigsUpdated>> { return phantom(AggregatorConfigsUpdated.reified( )); } static get p() { return AggregatorConfigsUpdated.phantom() }

 static get bcs() { return bcs.struct("AggregatorConfigsUpdated", {

 aggregatorId: ID.bcs, feedHash: bcs.vector(bcs.u8()), minSampleSize: bcs.u64(), maxStalenessSeconds: bcs.u64(), maxVariance: bcs.u64(), minResponses: bcs.u32()

}) };

 static fromFields( fields: Record<string, any> ): AggregatorConfigsUpdated { return AggregatorConfigsUpdated.reified( ).new( { aggregatorId: decodeFromFields(ID.reified(), fields.aggregatorId), feedHash: decodeFromFields(reified.vector("u8"), fields.feedHash), minSampleSize: decodeFromFields("u64", fields.minSampleSize), maxStalenessSeconds: decodeFromFields("u64", fields.maxStalenessSeconds), maxVariance: decodeFromFields("u64", fields.maxVariance), minResponses: decodeFromFields("u32", fields.minResponses) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AggregatorConfigsUpdated { if (!isAggregatorConfigsUpdated(item.type)) { throw new Error("not a AggregatorConfigsUpdated type");

 }

 return AggregatorConfigsUpdated.reified( ).new( { aggregatorId: decodeFromFieldsWithTypes(ID.reified(), item.fields.aggregatorId), feedHash: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.feedHash), minSampleSize: decodeFromFieldsWithTypes("u64", item.fields.minSampleSize), maxStalenessSeconds: decodeFromFieldsWithTypes("u64", item.fields.maxStalenessSeconds), maxVariance: decodeFromFieldsWithTypes("u64", item.fields.maxVariance), minResponses: decodeFromFieldsWithTypes("u32", item.fields.minResponses) } ) }

 static fromBcs( data: Uint8Array ): AggregatorConfigsUpdated { return AggregatorConfigsUpdated.fromFields( AggregatorConfigsUpdated.bcs.parse(data) ) }

 toJSONField() { return {

 aggregatorId: this.aggregatorId,feedHash: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.feedHash),minSampleSize: this.minSampleSize.toString(),maxStalenessSeconds: this.maxStalenessSeconds.toString(),maxVariance: this.maxVariance.toString(),minResponses: this.minResponses,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AggregatorConfigsUpdated { return AggregatorConfigsUpdated.reified( ).new( { aggregatorId: decodeFromJSONField(ID.reified(), field.aggregatorId), feedHash: decodeFromJSONField(reified.vector("u8"), field.feedHash), minSampleSize: decodeFromJSONField("u64", field.minSampleSize), maxStalenessSeconds: decodeFromJSONField("u64", field.maxStalenessSeconds), maxVariance: decodeFromJSONField("u64", field.maxVariance), minResponses: decodeFromJSONField("u32", field.minResponses) } ) }

 static fromJSON( json: Record<string, any> ): AggregatorConfigsUpdated { if (json.$typeName !== AggregatorConfigsUpdated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AggregatorConfigsUpdated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AggregatorConfigsUpdated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAggregatorConfigsUpdated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AggregatorConfigsUpdated object`); } return AggregatorConfigsUpdated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AggregatorConfigsUpdated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAggregatorConfigsUpdated(data.bcs.type)) { throw new Error(`object at is not a AggregatorConfigsUpdated object`); }

 return AggregatorConfigsUpdated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AggregatorConfigsUpdated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AggregatorConfigsUpdated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AggregatorConfigsUpdated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAggregatorConfigsUpdated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AggregatorConfigsUpdated object`); }

 return AggregatorConfigsUpdated.fromSuiObjectData( res.data ); }

 }
