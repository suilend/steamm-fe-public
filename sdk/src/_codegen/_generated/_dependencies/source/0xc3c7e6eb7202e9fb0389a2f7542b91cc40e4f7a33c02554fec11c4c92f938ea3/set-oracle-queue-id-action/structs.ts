import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== OracleQueueIdSet =============================== */

export function isOracleQueueIdSet(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::set_oracle_queue_id_action::OracleQueueIdSet`; }

export interface OracleQueueIdSetFields { oldOracleQueueId: ToField<ID>; oracleQueueId: ToField<ID> }

export type OracleQueueIdSetReified = Reified< OracleQueueIdSet, OracleQueueIdSetFields >;

export class OracleQueueIdSet implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::set_oracle_queue_id_action::OracleQueueIdSet`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = OracleQueueIdSet.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::set_oracle_queue_id_action::OracleQueueIdSet`; readonly $typeArgs: []; readonly $isPhantom = OracleQueueIdSet.$isPhantom;

 readonly oldOracleQueueId: ToField<ID>; readonly oracleQueueId: ToField<ID>

 private constructor(typeArgs: [], fields: OracleQueueIdSetFields, ) { this.$fullTypeName = composeSuiType( OracleQueueIdSet.$typeName, ...typeArgs ) as `${typeof PKG_V1}::set_oracle_queue_id_action::OracleQueueIdSet`; this.$typeArgs = typeArgs;

 this.oldOracleQueueId = fields.oldOracleQueueId;; this.oracleQueueId = fields.oracleQueueId; }

 static reified( ): OracleQueueIdSetReified { return { typeName: OracleQueueIdSet.$typeName, fullTypeName: composeSuiType( OracleQueueIdSet.$typeName, ...[] ) as `${typeof PKG_V1}::set_oracle_queue_id_action::OracleQueueIdSet`, typeArgs: [ ] as [], isPhantom: OracleQueueIdSet.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => OracleQueueIdSet.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => OracleQueueIdSet.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => OracleQueueIdSet.fromBcs( data, ), bcs: OracleQueueIdSet.bcs, fromJSONField: (field: any) => OracleQueueIdSet.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => OracleQueueIdSet.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => OracleQueueIdSet.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => OracleQueueIdSet.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => OracleQueueIdSet.fetch( client, id, ), new: ( fields: OracleQueueIdSetFields, ) => { return new OracleQueueIdSet( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return OracleQueueIdSet.reified() }

 static phantom( ): PhantomReified<ToTypeStr<OracleQueueIdSet>> { return phantom(OracleQueueIdSet.reified( )); } static get p() { return OracleQueueIdSet.phantom() }

 static get bcs() { return bcs.struct("OracleQueueIdSet", {

 oldOracleQueueId: ID.bcs, oracleQueueId: ID.bcs

}) };

 static fromFields( fields: Record<string, any> ): OracleQueueIdSet { return OracleQueueIdSet.reified( ).new( { oldOracleQueueId: decodeFromFields(ID.reified(), fields.oldOracleQueueId), oracleQueueId: decodeFromFields(ID.reified(), fields.oracleQueueId) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): OracleQueueIdSet { if (!isOracleQueueIdSet(item.type)) { throw new Error("not a OracleQueueIdSet type");

 }

 return OracleQueueIdSet.reified( ).new( { oldOracleQueueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oldOracleQueueId), oracleQueueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleQueueId) } ) }

 static fromBcs( data: Uint8Array ): OracleQueueIdSet { return OracleQueueIdSet.fromFields( OracleQueueIdSet.bcs.parse(data) ) }

 toJSONField() { return {

 oldOracleQueueId: this.oldOracleQueueId,oracleQueueId: this.oracleQueueId,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): OracleQueueIdSet { return OracleQueueIdSet.reified( ).new( { oldOracleQueueId: decodeFromJSONField(ID.reified(), field.oldOracleQueueId), oracleQueueId: decodeFromJSONField(ID.reified(), field.oracleQueueId) } ) }

 static fromJSON( json: Record<string, any> ): OracleQueueIdSet { if (json.$typeName !== OracleQueueIdSet.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return OracleQueueIdSet.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): OracleQueueIdSet { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isOracleQueueIdSet(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a OracleQueueIdSet object`); } return OracleQueueIdSet.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): OracleQueueIdSet { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isOracleQueueIdSet(data.bcs.type)) { throw new Error(`object at is not a OracleQueueIdSet object`); }

 return OracleQueueIdSet.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return OracleQueueIdSet.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<OracleQueueIdSet> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching OracleQueueIdSet object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isOracleQueueIdSet(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a OracleQueueIdSet object`); }

 return OracleQueueIdSet.fromSuiObjectData( res.data ); }

 }
