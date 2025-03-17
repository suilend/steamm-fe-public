import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== OracleQueueCreated =============================== */

export function isOracleQueueCreated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::oracle_queue_init_action::OracleQueueCreated`; }

export interface OracleQueueCreatedFields { queueId: ToField<ID>; guardianQueueId: ToField<ID>; queueKey: ToField<Vector<"u8">> }

export type OracleQueueCreatedReified = Reified< OracleQueueCreated, OracleQueueCreatedFields >;

export class OracleQueueCreated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::oracle_queue_init_action::OracleQueueCreated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = OracleQueueCreated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::oracle_queue_init_action::OracleQueueCreated`; readonly $typeArgs: []; readonly $isPhantom = OracleQueueCreated.$isPhantom;

 readonly queueId: ToField<ID>; readonly guardianQueueId: ToField<ID>; readonly queueKey: ToField<Vector<"u8">>

 private constructor(typeArgs: [], fields: OracleQueueCreatedFields, ) { this.$fullTypeName = composeSuiType( OracleQueueCreated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::oracle_queue_init_action::OracleQueueCreated`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.guardianQueueId = fields.guardianQueueId;; this.queueKey = fields.queueKey; }

 static reified( ): OracleQueueCreatedReified { return { typeName: OracleQueueCreated.$typeName, fullTypeName: composeSuiType( OracleQueueCreated.$typeName, ...[] ) as `${typeof PKG_V1}::oracle_queue_init_action::OracleQueueCreated`, typeArgs: [ ] as [], isPhantom: OracleQueueCreated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => OracleQueueCreated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => OracleQueueCreated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => OracleQueueCreated.fromBcs( data, ), bcs: OracleQueueCreated.bcs, fromJSONField: (field: any) => OracleQueueCreated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => OracleQueueCreated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => OracleQueueCreated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => OracleQueueCreated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => OracleQueueCreated.fetch( client, id, ), new: ( fields: OracleQueueCreatedFields, ) => { return new OracleQueueCreated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return OracleQueueCreated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<OracleQueueCreated>> { return phantom(OracleQueueCreated.reified( )); } static get p() { return OracleQueueCreated.phantom() }

 static get bcs() { return bcs.struct("OracleQueueCreated", {

 queueId: ID.bcs, guardianQueueId: ID.bcs, queueKey: bcs.vector(bcs.u8())

}) };

 static fromFields( fields: Record<string, any> ): OracleQueueCreated { return OracleQueueCreated.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), guardianQueueId: decodeFromFields(ID.reified(), fields.guardianQueueId), queueKey: decodeFromFields(reified.vector("u8"), fields.queueKey) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): OracleQueueCreated { if (!isOracleQueueCreated(item.type)) { throw new Error("not a OracleQueueCreated type");

 }

 return OracleQueueCreated.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), guardianQueueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.guardianQueueId), queueKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.queueKey) } ) }

 static fromBcs( data: Uint8Array ): OracleQueueCreated { return OracleQueueCreated.fromFields( OracleQueueCreated.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,guardianQueueId: this.guardianQueueId,queueKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.queueKey),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): OracleQueueCreated { return OracleQueueCreated.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), guardianQueueId: decodeFromJSONField(ID.reified(), field.guardianQueueId), queueKey: decodeFromJSONField(reified.vector("u8"), field.queueKey) } ) }

 static fromJSON( json: Record<string, any> ): OracleQueueCreated { if (json.$typeName !== OracleQueueCreated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return OracleQueueCreated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): OracleQueueCreated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isOracleQueueCreated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a OracleQueueCreated object`); } return OracleQueueCreated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): OracleQueueCreated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isOracleQueueCreated(data.bcs.type)) { throw new Error(`object at is not a OracleQueueCreated object`); }

 return OracleQueueCreated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return OracleQueueCreated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<OracleQueueCreated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching OracleQueueCreated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isOracleQueueCreated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a OracleQueueCreated object`); }

 return OracleQueueCreated.fromSuiObjectData( res.data ); }

 }
