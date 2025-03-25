import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID, UID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== Oracle =============================== */

export function isOracle(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle::Oracle`; }

export interface OracleFields { id: ToField<UID>; oracleKey: ToField<Vector<"u8">>; queue: ToField<ID>; queueKey: ToField<Vector<"u8">>; expirationTimeMs: ToField<"u64">; mrEnclave: ToField<Vector<"u8">>; secp256K1Key: ToField<Vector<"u8">>; validAttestations: ToField<Vector<Attestation>>; version: ToField<"u8"> }

export type OracleReified = Reified< Oracle, OracleFields >;

export class Oracle implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle::Oracle`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Oracle.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle::Oracle`; readonly $typeArgs: []; readonly $isPhantom = Oracle.$isPhantom;

 readonly id: ToField<UID>; readonly oracleKey: ToField<Vector<"u8">>; readonly queue: ToField<ID>; readonly queueKey: ToField<Vector<"u8">>; readonly expirationTimeMs: ToField<"u64">; readonly mrEnclave: ToField<Vector<"u8">>; readonly secp256K1Key: ToField<Vector<"u8">>; readonly validAttestations: ToField<Vector<Attestation>>; readonly version: ToField<"u8">

 private constructor(typeArgs: [], fields: OracleFields, ) { this.$fullTypeName = composeSuiType( Oracle.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle::Oracle`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.oracleKey = fields.oracleKey;; this.queue = fields.queue;; this.queueKey = fields.queueKey;; this.expirationTimeMs = fields.expirationTimeMs;; this.mrEnclave = fields.mrEnclave;; this.secp256K1Key = fields.secp256K1Key;; this.validAttestations = fields.validAttestations;; this.version = fields.version; }

 static reified( ): OracleReified { return { typeName: Oracle.$typeName, fullTypeName: composeSuiType( Oracle.$typeName, ...[] ) as `${typeof PKG_V1}::oracle::Oracle`, typeArgs: [ ] as [], isPhantom: Oracle.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Oracle.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Oracle.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Oracle.fromBcs( data, ), bcs: Oracle.bcs, fromJSONField: (field: any) => Oracle.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Oracle.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Oracle.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Oracle.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Oracle.fetch( client, id, ), new: ( fields: OracleFields, ) => { return new Oracle( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Oracle.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Oracle>> { return phantom(Oracle.reified( )); } static get p() { return Oracle.phantom() }

 static get bcs() { return bcs.struct("Oracle", {

 id: UID.bcs, oracleKey: bcs.vector(bcs.u8()), queue: ID.bcs, queueKey: bcs.vector(bcs.u8()), expirationTimeMs: bcs.u64(), mrEnclave: bcs.vector(bcs.u8()), secp256K1Key: bcs.vector(bcs.u8()), validAttestations: bcs.vector(Attestation.bcs), version: bcs.u8()

}) };

 static fromFields( fields: Record<string, any> ): Oracle { return Oracle.reified( ).new( { id: decodeFromFields(UID.reified(), fields.id), oracleKey: decodeFromFields(reified.vector("u8"), fields.oracleKey), queue: decodeFromFields(ID.reified(), fields.queue), queueKey: decodeFromFields(reified.vector("u8"), fields.queueKey), expirationTimeMs: decodeFromFields("u64", fields.expirationTimeMs), mrEnclave: decodeFromFields(reified.vector("u8"), fields.mrEnclave), secp256K1Key: decodeFromFields(reified.vector("u8"), fields.secp256K1Key), validAttestations: decodeFromFields(reified.vector(Attestation.reified()), fields.validAttestations), version: decodeFromFields("u8", fields.version) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Oracle { if (!isOracle(item.type)) { throw new Error("not a Oracle type");

 }

 return Oracle.reified( ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), oracleKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.oracleKey), queue: decodeFromFieldsWithTypes(ID.reified(), item.fields.queue), queueKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.queueKey), expirationTimeMs: decodeFromFieldsWithTypes("u64", item.fields.expirationTimeMs), mrEnclave: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.mrEnclave), secp256K1Key: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.secp256K1Key), validAttestations: decodeFromFieldsWithTypes(reified.vector(Attestation.reified()), item.fields.validAttestations), version: decodeFromFieldsWithTypes("u8", item.fields.version) } ) }

 static fromBcs( data: Uint8Array ): Oracle { return Oracle.fromFields( Oracle.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,oracleKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.oracleKey),queue: this.queue,queueKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.queueKey),expirationTimeMs: this.expirationTimeMs.toString(),mrEnclave: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.mrEnclave),secp256K1Key: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.secp256K1Key),validAttestations: fieldToJSON<Vector<Attestation>>(`vector<${Attestation.$typeName}>`, this.validAttestations),version: this.version,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Oracle { return Oracle.reified( ).new( { id: decodeFromJSONField(UID.reified(), field.id), oracleKey: decodeFromJSONField(reified.vector("u8"), field.oracleKey), queue: decodeFromJSONField(ID.reified(), field.queue), queueKey: decodeFromJSONField(reified.vector("u8"), field.queueKey), expirationTimeMs: decodeFromJSONField("u64", field.expirationTimeMs), mrEnclave: decodeFromJSONField(reified.vector("u8"), field.mrEnclave), secp256K1Key: decodeFromJSONField(reified.vector("u8"), field.secp256K1Key), validAttestations: decodeFromJSONField(reified.vector(Attestation.reified()), field.validAttestations), version: decodeFromJSONField("u8", field.version) } ) }

 static fromJSON( json: Record<string, any> ): Oracle { if (json.$typeName !== Oracle.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Oracle.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Oracle { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isOracle(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Oracle object`); } return Oracle.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Oracle { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isOracle(data.bcs.type)) { throw new Error(`object at is not a Oracle object`); }

 return Oracle.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Oracle.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Oracle> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Oracle object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isOracle(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Oracle object`); }

 return Oracle.fromSuiObjectData( res.data ); }

 }

/* ============================== Attestation =============================== */

export function isAttestation(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle::Attestation`; }

export interface AttestationFields { guardianId: ToField<ID>; secp256K1Key: ToField<Vector<"u8">>; timestampMs: ToField<"u64"> }

export type AttestationReified = Reified< Attestation, AttestationFields >;

export class Attestation implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle::Attestation`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Attestation.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle::Attestation`; readonly $typeArgs: []; readonly $isPhantom = Attestation.$isPhantom;

 readonly guardianId: ToField<ID>; readonly secp256K1Key: ToField<Vector<"u8">>; readonly timestampMs: ToField<"u64">

 private constructor(typeArgs: [], fields: AttestationFields, ) { this.$fullTypeName = composeSuiType( Attestation.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle::Attestation`; this.$typeArgs = typeArgs;

 this.guardianId = fields.guardianId;; this.secp256K1Key = fields.secp256K1Key;; this.timestampMs = fields.timestampMs; }

 static reified( ): AttestationReified { return { typeName: Attestation.$typeName, fullTypeName: composeSuiType( Attestation.$typeName, ...[] ) as `${typeof PKG_V1}::oracle::Attestation`, typeArgs: [ ] as [], isPhantom: Attestation.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Attestation.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Attestation.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Attestation.fromBcs( data, ), bcs: Attestation.bcs, fromJSONField: (field: any) => Attestation.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Attestation.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Attestation.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Attestation.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Attestation.fetch( client, id, ), new: ( fields: AttestationFields, ) => { return new Attestation( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Attestation.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Attestation>> { return phantom(Attestation.reified( )); } static get p() { return Attestation.phantom() }

 static get bcs() { return bcs.struct("Attestation", {

 guardianId: ID.bcs, secp256K1Key: bcs.vector(bcs.u8()), timestampMs: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): Attestation { return Attestation.reified( ).new( { guardianId: decodeFromFields(ID.reified(), fields.guardianId), secp256K1Key: decodeFromFields(reified.vector("u8"), fields.secp256K1Key), timestampMs: decodeFromFields("u64", fields.timestampMs) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Attestation { if (!isAttestation(item.type)) { throw new Error("not a Attestation type");

 }

 return Attestation.reified( ).new( { guardianId: decodeFromFieldsWithTypes(ID.reified(), item.fields.guardianId), secp256K1Key: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.secp256K1Key), timestampMs: decodeFromFieldsWithTypes("u64", item.fields.timestampMs) } ) }

 static fromBcs( data: Uint8Array ): Attestation { return Attestation.fromFields( Attestation.bcs.parse(data) ) }

 toJSONField() { return {

 guardianId: this.guardianId,secp256K1Key: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.secp256K1Key),timestampMs: this.timestampMs.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Attestation { return Attestation.reified( ).new( { guardianId: decodeFromJSONField(ID.reified(), field.guardianId), secp256K1Key: decodeFromJSONField(reified.vector("u8"), field.secp256K1Key), timestampMs: decodeFromJSONField("u64", field.timestampMs) } ) }

 static fromJSON( json: Record<string, any> ): Attestation { if (json.$typeName !== Attestation.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Attestation.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Attestation { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAttestation(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Attestation object`); } return Attestation.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Attestation { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAttestation(data.bcs.type)) { throw new Error(`object at is not a Attestation object`); }

 return Attestation.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Attestation.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Attestation> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Attestation object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAttestation(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Attestation object`); }

 return Attestation.fromSuiObjectData( res.data ); }

 }
