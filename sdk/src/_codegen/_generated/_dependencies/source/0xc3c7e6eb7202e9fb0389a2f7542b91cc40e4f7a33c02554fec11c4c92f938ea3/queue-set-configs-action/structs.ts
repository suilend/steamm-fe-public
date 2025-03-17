import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {String} from "../../0x1/string/structs";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== QueueConfigsUpdated =============================== */

export function isQueueConfigsUpdated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue_set_configs_action::QueueConfigsUpdated`; }

export interface QueueConfigsUpdatedFields { queueId: ToField<ID>; name: ToField<String>; fee: ToField<"u64">; feeRecipient: ToField<"address">; minAttestations: ToField<"u64">; oracleValidityLengthMs: ToField<"u64"> }

export type QueueConfigsUpdatedReified = Reified< QueueConfigsUpdated, QueueConfigsUpdatedFields >;

export class QueueConfigsUpdated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue_set_configs_action::QueueConfigsUpdated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = QueueConfigsUpdated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue_set_configs_action::QueueConfigsUpdated`; readonly $typeArgs: []; readonly $isPhantom = QueueConfigsUpdated.$isPhantom;

 readonly queueId: ToField<ID>; readonly name: ToField<String>; readonly fee: ToField<"u64">; readonly feeRecipient: ToField<"address">; readonly minAttestations: ToField<"u64">; readonly oracleValidityLengthMs: ToField<"u64">

 private constructor(typeArgs: [], fields: QueueConfigsUpdatedFields, ) { this.$fullTypeName = composeSuiType( QueueConfigsUpdated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue_set_configs_action::QueueConfigsUpdated`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.name = fields.name;; this.fee = fields.fee;; this.feeRecipient = fields.feeRecipient;; this.minAttestations = fields.minAttestations;; this.oracleValidityLengthMs = fields.oracleValidityLengthMs; }

 static reified( ): QueueConfigsUpdatedReified { return { typeName: QueueConfigsUpdated.$typeName, fullTypeName: composeSuiType( QueueConfigsUpdated.$typeName, ...[] ) as `${typeof PKG_V1}::queue_set_configs_action::QueueConfigsUpdated`, typeArgs: [ ] as [], isPhantom: QueueConfigsUpdated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => QueueConfigsUpdated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => QueueConfigsUpdated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => QueueConfigsUpdated.fromBcs( data, ), bcs: QueueConfigsUpdated.bcs, fromJSONField: (field: any) => QueueConfigsUpdated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => QueueConfigsUpdated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => QueueConfigsUpdated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => QueueConfigsUpdated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => QueueConfigsUpdated.fetch( client, id, ), new: ( fields: QueueConfigsUpdatedFields, ) => { return new QueueConfigsUpdated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return QueueConfigsUpdated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<QueueConfigsUpdated>> { return phantom(QueueConfigsUpdated.reified( )); } static get p() { return QueueConfigsUpdated.phantom() }

 static get bcs() { return bcs.struct("QueueConfigsUpdated", {

 queueId: ID.bcs, name: String.bcs, fee: bcs.u64(), feeRecipient: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), minAttestations: bcs.u64(), oracleValidityLengthMs: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): QueueConfigsUpdated { return QueueConfigsUpdated.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), name: decodeFromFields(String.reified(), fields.name), fee: decodeFromFields("u64", fields.fee), feeRecipient: decodeFromFields("address", fields.feeRecipient), minAttestations: decodeFromFields("u64", fields.minAttestations), oracleValidityLengthMs: decodeFromFields("u64", fields.oracleValidityLengthMs) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): QueueConfigsUpdated { if (!isQueueConfigsUpdated(item.type)) { throw new Error("not a QueueConfigsUpdated type");

 }

 return QueueConfigsUpdated.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), name: decodeFromFieldsWithTypes(String.reified(), item.fields.name), fee: decodeFromFieldsWithTypes("u64", item.fields.fee), feeRecipient: decodeFromFieldsWithTypes("address", item.fields.feeRecipient), minAttestations: decodeFromFieldsWithTypes("u64", item.fields.minAttestations), oracleValidityLengthMs: decodeFromFieldsWithTypes("u64", item.fields.oracleValidityLengthMs) } ) }

 static fromBcs( data: Uint8Array ): QueueConfigsUpdated { return QueueConfigsUpdated.fromFields( QueueConfigsUpdated.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,name: this.name,fee: this.fee.toString(),feeRecipient: this.feeRecipient,minAttestations: this.minAttestations.toString(),oracleValidityLengthMs: this.oracleValidityLengthMs.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): QueueConfigsUpdated { return QueueConfigsUpdated.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), name: decodeFromJSONField(String.reified(), field.name), fee: decodeFromJSONField("u64", field.fee), feeRecipient: decodeFromJSONField("address", field.feeRecipient), minAttestations: decodeFromJSONField("u64", field.minAttestations), oracleValidityLengthMs: decodeFromJSONField("u64", field.oracleValidityLengthMs) } ) }

 static fromJSON( json: Record<string, any> ): QueueConfigsUpdated { if (json.$typeName !== QueueConfigsUpdated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return QueueConfigsUpdated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): QueueConfigsUpdated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isQueueConfigsUpdated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a QueueConfigsUpdated object`); } return QueueConfigsUpdated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): QueueConfigsUpdated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isQueueConfigsUpdated(data.bcs.type)) { throw new Error(`object at is not a QueueConfigsUpdated object`); }

 return QueueConfigsUpdated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return QueueConfigsUpdated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<QueueConfigsUpdated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching QueueConfigsUpdated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isQueueConfigsUpdated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a QueueConfigsUpdated object`); }

 return QueueConfigsUpdated.fromSuiObjectData( res.data ); }

 }
