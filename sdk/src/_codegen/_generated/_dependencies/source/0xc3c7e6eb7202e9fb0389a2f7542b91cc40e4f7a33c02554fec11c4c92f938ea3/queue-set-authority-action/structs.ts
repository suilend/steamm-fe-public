import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== QueueAuthorityUpdated =============================== */

export function isQueueAuthorityUpdated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue_set_authority_action::QueueAuthorityUpdated`; }

export interface QueueAuthorityUpdatedFields { queueId: ToField<ID>; existingAuthority: ToField<"address">; newAuthority: ToField<"address"> }

export type QueueAuthorityUpdatedReified = Reified< QueueAuthorityUpdated, QueueAuthorityUpdatedFields >;

export class QueueAuthorityUpdated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue_set_authority_action::QueueAuthorityUpdated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = QueueAuthorityUpdated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue_set_authority_action::QueueAuthorityUpdated`; readonly $typeArgs: []; readonly $isPhantom = QueueAuthorityUpdated.$isPhantom;

 readonly queueId: ToField<ID>; readonly existingAuthority: ToField<"address">; readonly newAuthority: ToField<"address">

 private constructor(typeArgs: [], fields: QueueAuthorityUpdatedFields, ) { this.$fullTypeName = composeSuiType( QueueAuthorityUpdated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue_set_authority_action::QueueAuthorityUpdated`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.existingAuthority = fields.existingAuthority;; this.newAuthority = fields.newAuthority; }

 static reified( ): QueueAuthorityUpdatedReified { return { typeName: QueueAuthorityUpdated.$typeName, fullTypeName: composeSuiType( QueueAuthorityUpdated.$typeName, ...[] ) as `${typeof PKG_V1}::queue_set_authority_action::QueueAuthorityUpdated`, typeArgs: [ ] as [], isPhantom: QueueAuthorityUpdated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => QueueAuthorityUpdated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => QueueAuthorityUpdated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => QueueAuthorityUpdated.fromBcs( data, ), bcs: QueueAuthorityUpdated.bcs, fromJSONField: (field: any) => QueueAuthorityUpdated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => QueueAuthorityUpdated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => QueueAuthorityUpdated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => QueueAuthorityUpdated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => QueueAuthorityUpdated.fetch( client, id, ), new: ( fields: QueueAuthorityUpdatedFields, ) => { return new QueueAuthorityUpdated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return QueueAuthorityUpdated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<QueueAuthorityUpdated>> { return phantom(QueueAuthorityUpdated.reified( )); } static get p() { return QueueAuthorityUpdated.phantom() }

 static get bcs() { return bcs.struct("QueueAuthorityUpdated", {

 queueId: ID.bcs, existingAuthority: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), newAuthority: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), })

}) };

 static fromFields( fields: Record<string, any> ): QueueAuthorityUpdated { return QueueAuthorityUpdated.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), existingAuthority: decodeFromFields("address", fields.existingAuthority), newAuthority: decodeFromFields("address", fields.newAuthority) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): QueueAuthorityUpdated { if (!isQueueAuthorityUpdated(item.type)) { throw new Error("not a QueueAuthorityUpdated type");

 }

 return QueueAuthorityUpdated.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), existingAuthority: decodeFromFieldsWithTypes("address", item.fields.existingAuthority), newAuthority: decodeFromFieldsWithTypes("address", item.fields.newAuthority) } ) }

 static fromBcs( data: Uint8Array ): QueueAuthorityUpdated { return QueueAuthorityUpdated.fromFields( QueueAuthorityUpdated.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,existingAuthority: this.existingAuthority,newAuthority: this.newAuthority,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): QueueAuthorityUpdated { return QueueAuthorityUpdated.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), existingAuthority: decodeFromJSONField("address", field.existingAuthority), newAuthority: decodeFromJSONField("address", field.newAuthority) } ) }

 static fromJSON( json: Record<string, any> ): QueueAuthorityUpdated { if (json.$typeName !== QueueAuthorityUpdated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return QueueAuthorityUpdated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): QueueAuthorityUpdated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isQueueAuthorityUpdated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a QueueAuthorityUpdated object`); } return QueueAuthorityUpdated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): QueueAuthorityUpdated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isQueueAuthorityUpdated(data.bcs.type)) { throw new Error(`object at is not a QueueAuthorityUpdated object`); }

 return QueueAuthorityUpdated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return QueueAuthorityUpdated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<QueueAuthorityUpdated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching QueueAuthorityUpdated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isQueueAuthorityUpdated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a QueueAuthorityUpdated object`); }

 return QueueAuthorityUpdated.fromSuiObjectData( res.data ); }

 }
