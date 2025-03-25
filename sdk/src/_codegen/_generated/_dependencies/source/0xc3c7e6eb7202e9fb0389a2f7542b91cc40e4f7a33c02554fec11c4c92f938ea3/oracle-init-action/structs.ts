import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== OracleCreated =============================== */

export function isOracleCreated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle_init_action::OracleCreated`; }

export interface OracleCreatedFields { oracleId: ToField<ID>; queueId: ToField<ID>; oracleKey: ToField<Vector<"u8">> }

export type OracleCreatedReified = Reified< OracleCreated, OracleCreatedFields >;

export class OracleCreated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle_init_action::OracleCreated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = OracleCreated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle_init_action::OracleCreated`; readonly $typeArgs: []; readonly $isPhantom = OracleCreated.$isPhantom;

 readonly oracleId: ToField<ID>; readonly queueId: ToField<ID>; readonly oracleKey: ToField<Vector<"u8">>

 private constructor(typeArgs: [], fields: OracleCreatedFields, ) { this.$fullTypeName = composeSuiType( OracleCreated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle_init_action::OracleCreated`; this.$typeArgs = typeArgs;

 this.oracleId = fields.oracleId;; this.queueId = fields.queueId;; this.oracleKey = fields.oracleKey; }

 static reified( ): OracleCreatedReified { return { typeName: OracleCreated.$typeName, fullTypeName: composeSuiType( OracleCreated.$typeName, ...[] ) as `${typeof PKG_V1}::oracle_init_action::OracleCreated`, typeArgs: [ ] as [], isPhantom: OracleCreated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => OracleCreated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => OracleCreated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => OracleCreated.fromBcs( data, ), bcs: OracleCreated.bcs, fromJSONField: (field: any) => OracleCreated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => OracleCreated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => OracleCreated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => OracleCreated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => OracleCreated.fetch( client, id, ), new: ( fields: OracleCreatedFields, ) => { return new OracleCreated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return OracleCreated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<OracleCreated>> { return phantom(OracleCreated.reified( )); } static get p() { return OracleCreated.phantom() }

 static get bcs() { return bcs.struct("OracleCreated", {

 oracleId: ID.bcs, queueId: ID.bcs, oracleKey: bcs.vector(bcs.u8())

}) };

 static fromFields( fields: Record<string, any> ): OracleCreated { return OracleCreated.reified( ).new( { oracleId: decodeFromFields(ID.reified(), fields.oracleId), queueId: decodeFromFields(ID.reified(), fields.queueId), oracleKey: decodeFromFields(reified.vector("u8"), fields.oracleKey) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): OracleCreated { if (!isOracleCreated(item.type)) { throw new Error("not a OracleCreated type");

 }

 return OracleCreated.reified( ).new( { oracleId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleId), queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), oracleKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.oracleKey) } ) }

 static fromBcs( data: Uint8Array ): OracleCreated { return OracleCreated.fromFields( OracleCreated.bcs.parse(data) ) }

 toJSONField() { return {

 oracleId: this.oracleId,queueId: this.queueId,oracleKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.oracleKey),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): OracleCreated { return OracleCreated.reified( ).new( { oracleId: decodeFromJSONField(ID.reified(), field.oracleId), queueId: decodeFromJSONField(ID.reified(), field.queueId), oracleKey: decodeFromJSONField(reified.vector("u8"), field.oracleKey) } ) }

 static fromJSON( json: Record<string, any> ): OracleCreated { if (json.$typeName !== OracleCreated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return OracleCreated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): OracleCreated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isOracleCreated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a OracleCreated object`); } return OracleCreated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): OracleCreated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isOracleCreated(data.bcs.type)) { throw new Error(`object at is not a OracleCreated object`); }

 return OracleCreated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return OracleCreated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<OracleCreated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching OracleCreated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isOracleCreated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a OracleCreated object`); }

 return OracleCreated.fromSuiObjectData( res.data ); }

 }
