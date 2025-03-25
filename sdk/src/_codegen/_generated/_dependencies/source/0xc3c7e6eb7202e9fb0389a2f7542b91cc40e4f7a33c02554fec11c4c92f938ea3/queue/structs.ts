import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom, ToTypeStr as ToPhantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {String} from "../../0x1/string/structs";
import {TypeName} from "../../0x1/type-name/structs";
import {ID, UID} from "../../0x2/object/structs";
import {Table} from "../../0x2/table/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== ExistingOracle =============================== */

export function isExistingOracle(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue::ExistingOracle`; }

export interface ExistingOracleFields { oracleId: ToField<ID>; oracleKey: ToField<Vector<"u8">> }

export type ExistingOracleReified = Reified< ExistingOracle, ExistingOracleFields >;

export class ExistingOracle implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue::ExistingOracle`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = ExistingOracle.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue::ExistingOracle`; readonly $typeArgs: []; readonly $isPhantom = ExistingOracle.$isPhantom;

 readonly oracleId: ToField<ID>; readonly oracleKey: ToField<Vector<"u8">>

 private constructor(typeArgs: [], fields: ExistingOracleFields, ) { this.$fullTypeName = composeSuiType( ExistingOracle.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue::ExistingOracle`; this.$typeArgs = typeArgs;

 this.oracleId = fields.oracleId;; this.oracleKey = fields.oracleKey; }

 static reified( ): ExistingOracleReified { return { typeName: ExistingOracle.$typeName, fullTypeName: composeSuiType( ExistingOracle.$typeName, ...[] ) as `${typeof PKG_V1}::queue::ExistingOracle`, typeArgs: [ ] as [], isPhantom: ExistingOracle.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => ExistingOracle.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => ExistingOracle.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => ExistingOracle.fromBcs( data, ), bcs: ExistingOracle.bcs, fromJSONField: (field: any) => ExistingOracle.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => ExistingOracle.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => ExistingOracle.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => ExistingOracle.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => ExistingOracle.fetch( client, id, ), new: ( fields: ExistingOracleFields, ) => { return new ExistingOracle( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return ExistingOracle.reified() }

 static phantom( ): PhantomReified<ToTypeStr<ExistingOracle>> { return phantom(ExistingOracle.reified( )); } static get p() { return ExistingOracle.phantom() }

 static get bcs() { return bcs.struct("ExistingOracle", {

 oracleId: ID.bcs, oracleKey: bcs.vector(bcs.u8())

}) };

 static fromFields( fields: Record<string, any> ): ExistingOracle { return ExistingOracle.reified( ).new( { oracleId: decodeFromFields(ID.reified(), fields.oracleId), oracleKey: decodeFromFields(reified.vector("u8"), fields.oracleKey) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): ExistingOracle { if (!isExistingOracle(item.type)) { throw new Error("not a ExistingOracle type");

 }

 return ExistingOracle.reified( ).new( { oracleId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleId), oracleKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.oracleKey) } ) }

 static fromBcs( data: Uint8Array ): ExistingOracle { return ExistingOracle.fromFields( ExistingOracle.bcs.parse(data) ) }

 toJSONField() { return {

 oracleId: this.oracleId,oracleKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.oracleKey),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): ExistingOracle { return ExistingOracle.reified( ).new( { oracleId: decodeFromJSONField(ID.reified(), field.oracleId), oracleKey: decodeFromJSONField(reified.vector("u8"), field.oracleKey) } ) }

 static fromJSON( json: Record<string, any> ): ExistingOracle { if (json.$typeName !== ExistingOracle.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return ExistingOracle.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): ExistingOracle { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isExistingOracle(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a ExistingOracle object`); } return ExistingOracle.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): ExistingOracle { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isExistingOracle(data.bcs.type)) { throw new Error(`object at is not a ExistingOracle object`); }

 return ExistingOracle.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return ExistingOracle.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<ExistingOracle> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching ExistingOracle object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isExistingOracle(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a ExistingOracle object`); }

 return ExistingOracle.fromSuiObjectData( res.data ); }

 }

/* ============================== Queue =============================== */

export function isQueue(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue::Queue`; }

export interface QueueFields { id: ToField<UID>; queueKey: ToField<Vector<"u8">>; authority: ToField<"address">; name: ToField<String>; fee: ToField<"u64">; feeRecipient: ToField<"address">; minAttestations: ToField<"u64">; oracleValidityLengthMs: ToField<"u64">; lastQueueOverrideMs: ToField<"u64">; guardianQueueId: ToField<ID>; existingOracles: ToField<Table<ToPhantom<Vector<"u8">>, ToPhantom<ExistingOracle>>>; feeTypes: ToField<Vector<TypeName>>; version: ToField<"u8"> }

export type QueueReified = Reified< Queue, QueueFields >;

export class Queue implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue::Queue`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Queue.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue::Queue`; readonly $typeArgs: []; readonly $isPhantom = Queue.$isPhantom;

 readonly id: ToField<UID>; readonly queueKey: ToField<Vector<"u8">>; readonly authority: ToField<"address">; readonly name: ToField<String>; readonly fee: ToField<"u64">; readonly feeRecipient: ToField<"address">; readonly minAttestations: ToField<"u64">; readonly oracleValidityLengthMs: ToField<"u64">; readonly lastQueueOverrideMs: ToField<"u64">; readonly guardianQueueId: ToField<ID>; readonly existingOracles: ToField<Table<ToPhantom<Vector<"u8">>, ToPhantom<ExistingOracle>>>; readonly feeTypes: ToField<Vector<TypeName>>; readonly version: ToField<"u8">

 private constructor(typeArgs: [], fields: QueueFields, ) { this.$fullTypeName = composeSuiType( Queue.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue::Queue`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.queueKey = fields.queueKey;; this.authority = fields.authority;; this.name = fields.name;; this.fee = fields.fee;; this.feeRecipient = fields.feeRecipient;; this.minAttestations = fields.minAttestations;; this.oracleValidityLengthMs = fields.oracleValidityLengthMs;; this.lastQueueOverrideMs = fields.lastQueueOverrideMs;; this.guardianQueueId = fields.guardianQueueId;; this.existingOracles = fields.existingOracles;; this.feeTypes = fields.feeTypes;; this.version = fields.version; }

 static reified( ): QueueReified { return { typeName: Queue.$typeName, fullTypeName: composeSuiType( Queue.$typeName, ...[] ) as `${typeof PKG_V1}::queue::Queue`, typeArgs: [ ] as [], isPhantom: Queue.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Queue.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Queue.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Queue.fromBcs( data, ), bcs: Queue.bcs, fromJSONField: (field: any) => Queue.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Queue.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Queue.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Queue.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Queue.fetch( client, id, ), new: ( fields: QueueFields, ) => { return new Queue( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Queue.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Queue>> { return phantom(Queue.reified( )); } static get p() { return Queue.phantom() }

 static get bcs() { return bcs.struct("Queue", {

 id: UID.bcs, queueKey: bcs.vector(bcs.u8()), authority: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), name: String.bcs, fee: bcs.u64(), feeRecipient: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), minAttestations: bcs.u64(), oracleValidityLengthMs: bcs.u64(), lastQueueOverrideMs: bcs.u64(), guardianQueueId: ID.bcs, existingOracles: Table.bcs, feeTypes: bcs.vector(TypeName.bcs), version: bcs.u8()

}) };

 static fromFields( fields: Record<string, any> ): Queue { return Queue.reified( ).new( { id: decodeFromFields(UID.reified(), fields.id), queueKey: decodeFromFields(reified.vector("u8"), fields.queueKey), authority: decodeFromFields("address", fields.authority), name: decodeFromFields(String.reified(), fields.name), fee: decodeFromFields("u64", fields.fee), feeRecipient: decodeFromFields("address", fields.feeRecipient), minAttestations: decodeFromFields("u64", fields.minAttestations), oracleValidityLengthMs: decodeFromFields("u64", fields.oracleValidityLengthMs), lastQueueOverrideMs: decodeFromFields("u64", fields.lastQueueOverrideMs), guardianQueueId: decodeFromFields(ID.reified(), fields.guardianQueueId), existingOracles: decodeFromFields(Table.reified(reified.phantom(reified.vector("u8")), reified.phantom(ExistingOracle.reified())), fields.existingOracles), feeTypes: decodeFromFields(reified.vector(TypeName.reified()), fields.feeTypes), version: decodeFromFields("u8", fields.version) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Queue { if (!isQueue(item.type)) { throw new Error("not a Queue type");

 }

 return Queue.reified( ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), queueKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.queueKey), authority: decodeFromFieldsWithTypes("address", item.fields.authority), name: decodeFromFieldsWithTypes(String.reified(), item.fields.name), fee: decodeFromFieldsWithTypes("u64", item.fields.fee), feeRecipient: decodeFromFieldsWithTypes("address", item.fields.feeRecipient), minAttestations: decodeFromFieldsWithTypes("u64", item.fields.minAttestations), oracleValidityLengthMs: decodeFromFieldsWithTypes("u64", item.fields.oracleValidityLengthMs), lastQueueOverrideMs: decodeFromFieldsWithTypes("u64", item.fields.lastQueueOverrideMs), guardianQueueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.guardianQueueId), existingOracles: decodeFromFieldsWithTypes(Table.reified(reified.phantom(reified.vector("u8")), reified.phantom(ExistingOracle.reified())), item.fields.existingOracles), feeTypes: decodeFromFieldsWithTypes(reified.vector(TypeName.reified()), item.fields.feeTypes), version: decodeFromFieldsWithTypes("u8", item.fields.version) } ) }

 static fromBcs( data: Uint8Array ): Queue { return Queue.fromFields( Queue.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,queueKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.queueKey),authority: this.authority,name: this.name,fee: this.fee.toString(),feeRecipient: this.feeRecipient,minAttestations: this.minAttestations.toString(),oracleValidityLengthMs: this.oracleValidityLengthMs.toString(),lastQueueOverrideMs: this.lastQueueOverrideMs.toString(),guardianQueueId: this.guardianQueueId,existingOracles: this.existingOracles.toJSONField(),feeTypes: fieldToJSON<Vector<TypeName>>(`vector<${TypeName.$typeName}>`, this.feeTypes),version: this.version,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Queue { return Queue.reified( ).new( { id: decodeFromJSONField(UID.reified(), field.id), queueKey: decodeFromJSONField(reified.vector("u8"), field.queueKey), authority: decodeFromJSONField("address", field.authority), name: decodeFromJSONField(String.reified(), field.name), fee: decodeFromJSONField("u64", field.fee), feeRecipient: decodeFromJSONField("address", field.feeRecipient), minAttestations: decodeFromJSONField("u64", field.minAttestations), oracleValidityLengthMs: decodeFromJSONField("u64", field.oracleValidityLengthMs), lastQueueOverrideMs: decodeFromJSONField("u64", field.lastQueueOverrideMs), guardianQueueId: decodeFromJSONField(ID.reified(), field.guardianQueueId), existingOracles: decodeFromJSONField(Table.reified(reified.phantom(reified.vector("u8")), reified.phantom(ExistingOracle.reified())), field.existingOracles), feeTypes: decodeFromJSONField(reified.vector(TypeName.reified()), field.feeTypes), version: decodeFromJSONField("u8", field.version) } ) }

 static fromJSON( json: Record<string, any> ): Queue { if (json.$typeName !== Queue.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Queue.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Queue { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isQueue(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Queue object`); } return Queue.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Queue { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isQueue(data.bcs.type)) { throw new Error(`object at is not a Queue object`); }

 return Queue.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Queue.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Queue> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Queue object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isQueue(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Queue object`); }

 return Queue.fromSuiObjectData( res.data ); }

 }
