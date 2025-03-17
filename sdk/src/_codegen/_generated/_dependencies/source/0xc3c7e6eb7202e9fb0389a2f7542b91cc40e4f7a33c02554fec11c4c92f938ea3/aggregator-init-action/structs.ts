import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {String} from "../../0x1/string/structs";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== AggregatorCreated =============================== */

export function isAggregatorCreated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator_init_action::AggregatorCreated`; }

export interface AggregatorCreatedFields { aggregatorId: ToField<ID>; name: ToField<String> }

export type AggregatorCreatedReified = Reified< AggregatorCreated, AggregatorCreatedFields >;

export class AggregatorCreated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator_init_action::AggregatorCreated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AggregatorCreated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator_init_action::AggregatorCreated`; readonly $typeArgs: []; readonly $isPhantom = AggregatorCreated.$isPhantom;

 readonly aggregatorId: ToField<ID>; readonly name: ToField<String>

 private constructor(typeArgs: [], fields: AggregatorCreatedFields, ) { this.$fullTypeName = composeSuiType( AggregatorCreated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator_init_action::AggregatorCreated`; this.$typeArgs = typeArgs;

 this.aggregatorId = fields.aggregatorId;; this.name = fields.name; }

 static reified( ): AggregatorCreatedReified { return { typeName: AggregatorCreated.$typeName, fullTypeName: composeSuiType( AggregatorCreated.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator_init_action::AggregatorCreated`, typeArgs: [ ] as [], isPhantom: AggregatorCreated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AggregatorCreated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AggregatorCreated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AggregatorCreated.fromBcs( data, ), bcs: AggregatorCreated.bcs, fromJSONField: (field: any) => AggregatorCreated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AggregatorCreated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AggregatorCreated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AggregatorCreated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AggregatorCreated.fetch( client, id, ), new: ( fields: AggregatorCreatedFields, ) => { return new AggregatorCreated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AggregatorCreated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AggregatorCreated>> { return phantom(AggregatorCreated.reified( )); } static get p() { return AggregatorCreated.phantom() }

 static get bcs() { return bcs.struct("AggregatorCreated", {

 aggregatorId: ID.bcs, name: String.bcs

}) };

 static fromFields( fields: Record<string, any> ): AggregatorCreated { return AggregatorCreated.reified( ).new( { aggregatorId: decodeFromFields(ID.reified(), fields.aggregatorId), name: decodeFromFields(String.reified(), fields.name) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AggregatorCreated { if (!isAggregatorCreated(item.type)) { throw new Error("not a AggregatorCreated type");

 }

 return AggregatorCreated.reified( ).new( { aggregatorId: decodeFromFieldsWithTypes(ID.reified(), item.fields.aggregatorId), name: decodeFromFieldsWithTypes(String.reified(), item.fields.name) } ) }

 static fromBcs( data: Uint8Array ): AggregatorCreated { return AggregatorCreated.fromFields( AggregatorCreated.bcs.parse(data) ) }

 toJSONField() { return {

 aggregatorId: this.aggregatorId,name: this.name,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AggregatorCreated { return AggregatorCreated.reified( ).new( { aggregatorId: decodeFromJSONField(ID.reified(), field.aggregatorId), name: decodeFromJSONField(String.reified(), field.name) } ) }

 static fromJSON( json: Record<string, any> ): AggregatorCreated { if (json.$typeName !== AggregatorCreated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AggregatorCreated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AggregatorCreated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAggregatorCreated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AggregatorCreated object`); } return AggregatorCreated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AggregatorCreated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAggregatorCreated(data.bcs.type)) { throw new Error(`object at is not a AggregatorCreated object`); }

 return AggregatorCreated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AggregatorCreated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AggregatorCreated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AggregatorCreated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAggregatorCreated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AggregatorCreated object`); }

 return AggregatorCreated.fromSuiObjectData( res.data ); }

 }
