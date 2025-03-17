import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== QueueOracleOverride =============================== */

export function isQueueOracleOverride(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue_override_oracle_action::QueueOracleOverride`; }

export interface QueueOracleOverrideFields { queueId: ToField<ID>; oracleId: ToField<ID>; secp256K1Key: ToField<Vector<"u8">>; mrEnclave: ToField<Vector<"u8">>; expirationTimeMs: ToField<"u64"> }

export type QueueOracleOverrideReified = Reified< QueueOracleOverride, QueueOracleOverrideFields >;

export class QueueOracleOverride implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue_override_oracle_action::QueueOracleOverride`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = QueueOracleOverride.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue_override_oracle_action::QueueOracleOverride`; readonly $typeArgs: []; readonly $isPhantom = QueueOracleOverride.$isPhantom;

 readonly queueId: ToField<ID>; readonly oracleId: ToField<ID>; readonly secp256K1Key: ToField<Vector<"u8">>; readonly mrEnclave: ToField<Vector<"u8">>; readonly expirationTimeMs: ToField<"u64">

 private constructor(typeArgs: [], fields: QueueOracleOverrideFields, ) { this.$fullTypeName = composeSuiType( QueueOracleOverride.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue_override_oracle_action::QueueOracleOverride`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.oracleId = fields.oracleId;; this.secp256K1Key = fields.secp256K1Key;; this.mrEnclave = fields.mrEnclave;; this.expirationTimeMs = fields.expirationTimeMs; }

 static reified( ): QueueOracleOverrideReified { return { typeName: QueueOracleOverride.$typeName, fullTypeName: composeSuiType( QueueOracleOverride.$typeName, ...[] ) as `${typeof PKG_V1}::queue_override_oracle_action::QueueOracleOverride`, typeArgs: [ ] as [], isPhantom: QueueOracleOverride.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => QueueOracleOverride.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => QueueOracleOverride.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => QueueOracleOverride.fromBcs( data, ), bcs: QueueOracleOverride.bcs, fromJSONField: (field: any) => QueueOracleOverride.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => QueueOracleOverride.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => QueueOracleOverride.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => QueueOracleOverride.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => QueueOracleOverride.fetch( client, id, ), new: ( fields: QueueOracleOverrideFields, ) => { return new QueueOracleOverride( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return QueueOracleOverride.reified() }

 static phantom( ): PhantomReified<ToTypeStr<QueueOracleOverride>> { return phantom(QueueOracleOverride.reified( )); } static get p() { return QueueOracleOverride.phantom() }

 static get bcs() { return bcs.struct("QueueOracleOverride", {

 queueId: ID.bcs, oracleId: ID.bcs, secp256K1Key: bcs.vector(bcs.u8()), mrEnclave: bcs.vector(bcs.u8()), expirationTimeMs: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): QueueOracleOverride { return QueueOracleOverride.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), oracleId: decodeFromFields(ID.reified(), fields.oracleId), secp256K1Key: decodeFromFields(reified.vector("u8"), fields.secp256K1Key), mrEnclave: decodeFromFields(reified.vector("u8"), fields.mrEnclave), expirationTimeMs: decodeFromFields("u64", fields.expirationTimeMs) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): QueueOracleOverride { if (!isQueueOracleOverride(item.type)) { throw new Error("not a QueueOracleOverride type");

 }

 return QueueOracleOverride.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), oracleId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleId), secp256K1Key: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.secp256K1Key), mrEnclave: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.mrEnclave), expirationTimeMs: decodeFromFieldsWithTypes("u64", item.fields.expirationTimeMs) } ) }

 static fromBcs( data: Uint8Array ): QueueOracleOverride { return QueueOracleOverride.fromFields( QueueOracleOverride.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,oracleId: this.oracleId,secp256K1Key: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.secp256K1Key),mrEnclave: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.mrEnclave),expirationTimeMs: this.expirationTimeMs.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): QueueOracleOverride { return QueueOracleOverride.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), oracleId: decodeFromJSONField(ID.reified(), field.oracleId), secp256K1Key: decodeFromJSONField(reified.vector("u8"), field.secp256K1Key), mrEnclave: decodeFromJSONField(reified.vector("u8"), field.mrEnclave), expirationTimeMs: decodeFromJSONField("u64", field.expirationTimeMs) } ) }

 static fromJSON( json: Record<string, any> ): QueueOracleOverride { if (json.$typeName !== QueueOracleOverride.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return QueueOracleOverride.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): QueueOracleOverride { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isQueueOracleOverride(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a QueueOracleOverride object`); } return QueueOracleOverride.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): QueueOracleOverride { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isQueueOracleOverride(data.bcs.type)) { throw new Error(`object at is not a QueueOracleOverride object`); }

 return QueueOracleOverride.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return QueueOracleOverride.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<QueueOracleOverride> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching QueueOracleOverride object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isQueueOracleOverride(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a QueueOracleOverride object`); }

 return QueueOracleOverride.fromSuiObjectData( res.data ); }

 }
