import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== AggregatorDeleted =============================== */

export function isAggregatorDeleted(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator_delete_action::AggregatorDeleted`; }

export interface AggregatorDeletedFields { aggregatorId: ToField<ID> }

export type AggregatorDeletedReified = Reified< AggregatorDeleted, AggregatorDeletedFields >;

export class AggregatorDeleted implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator_delete_action::AggregatorDeleted`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AggregatorDeleted.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator_delete_action::AggregatorDeleted`; readonly $typeArgs: []; readonly $isPhantom = AggregatorDeleted.$isPhantom;

 readonly aggregatorId: ToField<ID>

 private constructor(typeArgs: [], fields: AggregatorDeletedFields, ) { this.$fullTypeName = composeSuiType( AggregatorDeleted.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator_delete_action::AggregatorDeleted`; this.$typeArgs = typeArgs;

 this.aggregatorId = fields.aggregatorId; }

 static reified( ): AggregatorDeletedReified { return { typeName: AggregatorDeleted.$typeName, fullTypeName: composeSuiType( AggregatorDeleted.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator_delete_action::AggregatorDeleted`, typeArgs: [ ] as [], isPhantom: AggregatorDeleted.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AggregatorDeleted.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AggregatorDeleted.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AggregatorDeleted.fromBcs( data, ), bcs: AggregatorDeleted.bcs, fromJSONField: (field: any) => AggregatorDeleted.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AggregatorDeleted.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AggregatorDeleted.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AggregatorDeleted.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AggregatorDeleted.fetch( client, id, ), new: ( fields: AggregatorDeletedFields, ) => { return new AggregatorDeleted( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AggregatorDeleted.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AggregatorDeleted>> { return phantom(AggregatorDeleted.reified( )); } static get p() { return AggregatorDeleted.phantom() }

 static get bcs() { return bcs.struct("AggregatorDeleted", {

 aggregatorId: ID.bcs

}) };

 static fromFields( fields: Record<string, any> ): AggregatorDeleted { return AggregatorDeleted.reified( ).new( { aggregatorId: decodeFromFields(ID.reified(), fields.aggregatorId) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AggregatorDeleted { if (!isAggregatorDeleted(item.type)) { throw new Error("not a AggregatorDeleted type");

 }

 return AggregatorDeleted.reified( ).new( { aggregatorId: decodeFromFieldsWithTypes(ID.reified(), item.fields.aggregatorId) } ) }

 static fromBcs( data: Uint8Array ): AggregatorDeleted { return AggregatorDeleted.fromFields( AggregatorDeleted.bcs.parse(data) ) }

 toJSONField() { return {

 aggregatorId: this.aggregatorId,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AggregatorDeleted { return AggregatorDeleted.reified( ).new( { aggregatorId: decodeFromJSONField(ID.reified(), field.aggregatorId) } ) }

 static fromJSON( json: Record<string, any> ): AggregatorDeleted { if (json.$typeName !== AggregatorDeleted.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AggregatorDeleted.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AggregatorDeleted { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAggregatorDeleted(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AggregatorDeleted object`); } return AggregatorDeleted.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AggregatorDeleted { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAggregatorDeleted(data.bcs.type)) { throw new Error(`object at is not a AggregatorDeleted object`); }

 return AggregatorDeleted.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AggregatorDeleted.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AggregatorDeleted> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AggregatorDeleted object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAggregatorDeleted(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AggregatorDeleted object`); }

 return AggregatorDeleted.fromSuiObjectData( res.data ); }

 }
