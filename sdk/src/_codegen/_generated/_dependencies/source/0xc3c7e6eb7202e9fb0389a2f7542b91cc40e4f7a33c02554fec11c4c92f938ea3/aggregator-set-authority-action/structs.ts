import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== AggregatorAuthorityUpdated =============================== */

export function isAggregatorAuthorityUpdated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator_set_authority_action::AggregatorAuthorityUpdated`; }

export interface AggregatorAuthorityUpdatedFields { aggregatorId: ToField<ID>; existingAuthority: ToField<"address">; newAuthority: ToField<"address"> }

export type AggregatorAuthorityUpdatedReified = Reified< AggregatorAuthorityUpdated, AggregatorAuthorityUpdatedFields >;

export class AggregatorAuthorityUpdated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator_set_authority_action::AggregatorAuthorityUpdated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AggregatorAuthorityUpdated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator_set_authority_action::AggregatorAuthorityUpdated`; readonly $typeArgs: []; readonly $isPhantom = AggregatorAuthorityUpdated.$isPhantom;

 readonly aggregatorId: ToField<ID>; readonly existingAuthority: ToField<"address">; readonly newAuthority: ToField<"address">

 private constructor(typeArgs: [], fields: AggregatorAuthorityUpdatedFields, ) { this.$fullTypeName = composeSuiType( AggregatorAuthorityUpdated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator_set_authority_action::AggregatorAuthorityUpdated`; this.$typeArgs = typeArgs;

 this.aggregatorId = fields.aggregatorId;; this.existingAuthority = fields.existingAuthority;; this.newAuthority = fields.newAuthority; }

 static reified( ): AggregatorAuthorityUpdatedReified { return { typeName: AggregatorAuthorityUpdated.$typeName, fullTypeName: composeSuiType( AggregatorAuthorityUpdated.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator_set_authority_action::AggregatorAuthorityUpdated`, typeArgs: [ ] as [], isPhantom: AggregatorAuthorityUpdated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AggregatorAuthorityUpdated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AggregatorAuthorityUpdated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AggregatorAuthorityUpdated.fromBcs( data, ), bcs: AggregatorAuthorityUpdated.bcs, fromJSONField: (field: any) => AggregatorAuthorityUpdated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AggregatorAuthorityUpdated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AggregatorAuthorityUpdated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AggregatorAuthorityUpdated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AggregatorAuthorityUpdated.fetch( client, id, ), new: ( fields: AggregatorAuthorityUpdatedFields, ) => { return new AggregatorAuthorityUpdated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AggregatorAuthorityUpdated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AggregatorAuthorityUpdated>> { return phantom(AggregatorAuthorityUpdated.reified( )); } static get p() { return AggregatorAuthorityUpdated.phantom() }

 static get bcs() { return bcs.struct("AggregatorAuthorityUpdated", {

 aggregatorId: ID.bcs, existingAuthority: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), newAuthority: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), })

}) };

 static fromFields( fields: Record<string, any> ): AggregatorAuthorityUpdated { return AggregatorAuthorityUpdated.reified( ).new( { aggregatorId: decodeFromFields(ID.reified(), fields.aggregatorId), existingAuthority: decodeFromFields("address", fields.existingAuthority), newAuthority: decodeFromFields("address", fields.newAuthority) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AggregatorAuthorityUpdated { if (!isAggregatorAuthorityUpdated(item.type)) { throw new Error("not a AggregatorAuthorityUpdated type");

 }

 return AggregatorAuthorityUpdated.reified( ).new( { aggregatorId: decodeFromFieldsWithTypes(ID.reified(), item.fields.aggregatorId), existingAuthority: decodeFromFieldsWithTypes("address", item.fields.existingAuthority), newAuthority: decodeFromFieldsWithTypes("address", item.fields.newAuthority) } ) }

 static fromBcs( data: Uint8Array ): AggregatorAuthorityUpdated { return AggregatorAuthorityUpdated.fromFields( AggregatorAuthorityUpdated.bcs.parse(data) ) }

 toJSONField() { return {

 aggregatorId: this.aggregatorId,existingAuthority: this.existingAuthority,newAuthority: this.newAuthority,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AggregatorAuthorityUpdated { return AggregatorAuthorityUpdated.reified( ).new( { aggregatorId: decodeFromJSONField(ID.reified(), field.aggregatorId), existingAuthority: decodeFromJSONField("address", field.existingAuthority), newAuthority: decodeFromJSONField("address", field.newAuthority) } ) }

 static fromJSON( json: Record<string, any> ): AggregatorAuthorityUpdated { if (json.$typeName !== AggregatorAuthorityUpdated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AggregatorAuthorityUpdated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AggregatorAuthorityUpdated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAggregatorAuthorityUpdated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AggregatorAuthorityUpdated object`); } return AggregatorAuthorityUpdated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AggregatorAuthorityUpdated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAggregatorAuthorityUpdated(data.bcs.type)) { throw new Error(`object at is not a AggregatorAuthorityUpdated object`); }

 return AggregatorAuthorityUpdated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AggregatorAuthorityUpdated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AggregatorAuthorityUpdated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AggregatorAuthorityUpdated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAggregatorAuthorityUpdated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AggregatorAuthorityUpdated object`); }

 return AggregatorAuthorityUpdated.fromSuiObjectData( res.data ); }

 }
