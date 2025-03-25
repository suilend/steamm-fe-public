import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== AttestationCreated =============================== */

export function isAttestationCreated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle_attest_action::AttestationCreated`; }

export interface AttestationCreatedFields { oracleId: ToField<ID>; guardianId: ToField<ID>; secp256K1Key: ToField<Vector<"u8">>; timestampMs: ToField<"u64"> }

export type AttestationCreatedReified = Reified< AttestationCreated, AttestationCreatedFields >;

export class AttestationCreated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle_attest_action::AttestationCreated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AttestationCreated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle_attest_action::AttestationCreated`; readonly $typeArgs: []; readonly $isPhantom = AttestationCreated.$isPhantom;

 readonly oracleId: ToField<ID>; readonly guardianId: ToField<ID>; readonly secp256K1Key: ToField<Vector<"u8">>; readonly timestampMs: ToField<"u64">

 private constructor(typeArgs: [], fields: AttestationCreatedFields, ) { this.$fullTypeName = composeSuiType( AttestationCreated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle_attest_action::AttestationCreated`; this.$typeArgs = typeArgs;

 this.oracleId = fields.oracleId;; this.guardianId = fields.guardianId;; this.secp256K1Key = fields.secp256K1Key;; this.timestampMs = fields.timestampMs; }

 static reified( ): AttestationCreatedReified { return { typeName: AttestationCreated.$typeName, fullTypeName: composeSuiType( AttestationCreated.$typeName, ...[] ) as `${typeof PKG_V1}::oracle_attest_action::AttestationCreated`, typeArgs: [ ] as [], isPhantom: AttestationCreated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AttestationCreated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AttestationCreated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AttestationCreated.fromBcs( data, ), bcs: AttestationCreated.bcs, fromJSONField: (field: any) => AttestationCreated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AttestationCreated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AttestationCreated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AttestationCreated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AttestationCreated.fetch( client, id, ), new: ( fields: AttestationCreatedFields, ) => { return new AttestationCreated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AttestationCreated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AttestationCreated>> { return phantom(AttestationCreated.reified( )); } static get p() { return AttestationCreated.phantom() }

 static get bcs() { return bcs.struct("AttestationCreated", {

 oracleId: ID.bcs, guardianId: ID.bcs, secp256K1Key: bcs.vector(bcs.u8()), timestampMs: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): AttestationCreated { return AttestationCreated.reified( ).new( { oracleId: decodeFromFields(ID.reified(), fields.oracleId), guardianId: decodeFromFields(ID.reified(), fields.guardianId), secp256K1Key: decodeFromFields(reified.vector("u8"), fields.secp256K1Key), timestampMs: decodeFromFields("u64", fields.timestampMs) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AttestationCreated { if (!isAttestationCreated(item.type)) { throw new Error("not a AttestationCreated type");

 }

 return AttestationCreated.reified( ).new( { oracleId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleId), guardianId: decodeFromFieldsWithTypes(ID.reified(), item.fields.guardianId), secp256K1Key: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.secp256K1Key), timestampMs: decodeFromFieldsWithTypes("u64", item.fields.timestampMs) } ) }

 static fromBcs( data: Uint8Array ): AttestationCreated { return AttestationCreated.fromFields( AttestationCreated.bcs.parse(data) ) }

 toJSONField() { return {

 oracleId: this.oracleId,guardianId: this.guardianId,secp256K1Key: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.secp256K1Key),timestampMs: this.timestampMs.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AttestationCreated { return AttestationCreated.reified( ).new( { oracleId: decodeFromJSONField(ID.reified(), field.oracleId), guardianId: decodeFromJSONField(ID.reified(), field.guardianId), secp256K1Key: decodeFromJSONField(reified.vector("u8"), field.secp256K1Key), timestampMs: decodeFromJSONField("u64", field.timestampMs) } ) }

 static fromJSON( json: Record<string, any> ): AttestationCreated { if (json.$typeName !== AttestationCreated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AttestationCreated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AttestationCreated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAttestationCreated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AttestationCreated object`); } return AttestationCreated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AttestationCreated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAttestationCreated(data.bcs.type)) { throw new Error(`object at is not a AttestationCreated object`); }

 return AttestationCreated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AttestationCreated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AttestationCreated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AttestationCreated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAttestationCreated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AttestationCreated object`); }

 return AttestationCreated.fromSuiObjectData( res.data ); }

 }

/* ============================== AttestationResolved =============================== */

export function isAttestationResolved(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle_attest_action::AttestationResolved`; }

export interface AttestationResolvedFields { oracleId: ToField<ID>; secp256K1Key: ToField<Vector<"u8">>; timestampMs: ToField<"u64"> }

export type AttestationResolvedReified = Reified< AttestationResolved, AttestationResolvedFields >;

export class AttestationResolved implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle_attest_action::AttestationResolved`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AttestationResolved.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle_attest_action::AttestationResolved`; readonly $typeArgs: []; readonly $isPhantom = AttestationResolved.$isPhantom;

 readonly oracleId: ToField<ID>; readonly secp256K1Key: ToField<Vector<"u8">>; readonly timestampMs: ToField<"u64">

 private constructor(typeArgs: [], fields: AttestationResolvedFields, ) { this.$fullTypeName = composeSuiType( AttestationResolved.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle_attest_action::AttestationResolved`; this.$typeArgs = typeArgs;

 this.oracleId = fields.oracleId;; this.secp256K1Key = fields.secp256K1Key;; this.timestampMs = fields.timestampMs; }

 static reified( ): AttestationResolvedReified { return { typeName: AttestationResolved.$typeName, fullTypeName: composeSuiType( AttestationResolved.$typeName, ...[] ) as `${typeof PKG_V1}::oracle_attest_action::AttestationResolved`, typeArgs: [ ] as [], isPhantom: AttestationResolved.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AttestationResolved.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AttestationResolved.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AttestationResolved.fromBcs( data, ), bcs: AttestationResolved.bcs, fromJSONField: (field: any) => AttestationResolved.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AttestationResolved.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AttestationResolved.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AttestationResolved.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AttestationResolved.fetch( client, id, ), new: ( fields: AttestationResolvedFields, ) => { return new AttestationResolved( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AttestationResolved.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AttestationResolved>> { return phantom(AttestationResolved.reified( )); } static get p() { return AttestationResolved.phantom() }

 static get bcs() { return bcs.struct("AttestationResolved", {

 oracleId: ID.bcs, secp256K1Key: bcs.vector(bcs.u8()), timestampMs: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): AttestationResolved { return AttestationResolved.reified( ).new( { oracleId: decodeFromFields(ID.reified(), fields.oracleId), secp256K1Key: decodeFromFields(reified.vector("u8"), fields.secp256K1Key), timestampMs: decodeFromFields("u64", fields.timestampMs) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AttestationResolved { if (!isAttestationResolved(item.type)) { throw new Error("not a AttestationResolved type");

 }

 return AttestationResolved.reified( ).new( { oracleId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleId), secp256K1Key: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.secp256K1Key), timestampMs: decodeFromFieldsWithTypes("u64", item.fields.timestampMs) } ) }

 static fromBcs( data: Uint8Array ): AttestationResolved { return AttestationResolved.fromFields( AttestationResolved.bcs.parse(data) ) }

 toJSONField() { return {

 oracleId: this.oracleId,secp256K1Key: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.secp256K1Key),timestampMs: this.timestampMs.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AttestationResolved { return AttestationResolved.reified( ).new( { oracleId: decodeFromJSONField(ID.reified(), field.oracleId), secp256K1Key: decodeFromJSONField(reified.vector("u8"), field.secp256K1Key), timestampMs: decodeFromJSONField("u64", field.timestampMs) } ) }

 static fromJSON( json: Record<string, any> ): AttestationResolved { if (json.$typeName !== AttestationResolved.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AttestationResolved.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AttestationResolved { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAttestationResolved(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AttestationResolved object`); } return AttestationResolved.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AttestationResolved { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAttestationResolved(data.bcs.type)) { throw new Error(`object at is not a AttestationResolved object`); }

 return AttestationResolved.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AttestationResolved.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AttestationResolved> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AttestationResolved object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAttestationResolved(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AttestationResolved object`); }

 return AttestationResolved.fromSuiObjectData( res.data ); }

 }
