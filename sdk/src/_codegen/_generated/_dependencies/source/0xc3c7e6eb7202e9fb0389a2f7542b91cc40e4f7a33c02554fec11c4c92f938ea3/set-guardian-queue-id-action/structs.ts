import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== GuardianQueueIdSet =============================== */

export function isGuardianQueueIdSet(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::set_guardian_queue_id_action::GuardianQueueIdSet`; }

export interface GuardianQueueIdSetFields { oldGuardianQueueId: ToField<ID>; guardianQueueId: ToField<ID> }

export type GuardianQueueIdSetReified = Reified< GuardianQueueIdSet, GuardianQueueIdSetFields >;

export class GuardianQueueIdSet implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::set_guardian_queue_id_action::GuardianQueueIdSet`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = GuardianQueueIdSet.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::set_guardian_queue_id_action::GuardianQueueIdSet`; readonly $typeArgs: []; readonly $isPhantom = GuardianQueueIdSet.$isPhantom;

 readonly oldGuardianQueueId: ToField<ID>; readonly guardianQueueId: ToField<ID>

 private constructor(typeArgs: [], fields: GuardianQueueIdSetFields, ) { this.$fullTypeName = composeSuiType( GuardianQueueIdSet.$typeName, ...typeArgs ) as `${typeof PKG_V1}::set_guardian_queue_id_action::GuardianQueueIdSet`; this.$typeArgs = typeArgs;

 this.oldGuardianQueueId = fields.oldGuardianQueueId;; this.guardianQueueId = fields.guardianQueueId; }

 static reified( ): GuardianQueueIdSetReified { return { typeName: GuardianQueueIdSet.$typeName, fullTypeName: composeSuiType( GuardianQueueIdSet.$typeName, ...[] ) as `${typeof PKG_V1}::set_guardian_queue_id_action::GuardianQueueIdSet`, typeArgs: [ ] as [], isPhantom: GuardianQueueIdSet.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => GuardianQueueIdSet.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => GuardianQueueIdSet.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => GuardianQueueIdSet.fromBcs( data, ), bcs: GuardianQueueIdSet.bcs, fromJSONField: (field: any) => GuardianQueueIdSet.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => GuardianQueueIdSet.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => GuardianQueueIdSet.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => GuardianQueueIdSet.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => GuardianQueueIdSet.fetch( client, id, ), new: ( fields: GuardianQueueIdSetFields, ) => { return new GuardianQueueIdSet( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return GuardianQueueIdSet.reified() }

 static phantom( ): PhantomReified<ToTypeStr<GuardianQueueIdSet>> { return phantom(GuardianQueueIdSet.reified( )); } static get p() { return GuardianQueueIdSet.phantom() }

 static get bcs() { return bcs.struct("GuardianQueueIdSet", {

 oldGuardianQueueId: ID.bcs, guardianQueueId: ID.bcs

}) };

 static fromFields( fields: Record<string, any> ): GuardianQueueIdSet { return GuardianQueueIdSet.reified( ).new( { oldGuardianQueueId: decodeFromFields(ID.reified(), fields.oldGuardianQueueId), guardianQueueId: decodeFromFields(ID.reified(), fields.guardianQueueId) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): GuardianQueueIdSet { if (!isGuardianQueueIdSet(item.type)) { throw new Error("not a GuardianQueueIdSet type");

 }

 return GuardianQueueIdSet.reified( ).new( { oldGuardianQueueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oldGuardianQueueId), guardianQueueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.guardianQueueId) } ) }

 static fromBcs( data: Uint8Array ): GuardianQueueIdSet { return GuardianQueueIdSet.fromFields( GuardianQueueIdSet.bcs.parse(data) ) }

 toJSONField() { return {

 oldGuardianQueueId: this.oldGuardianQueueId,guardianQueueId: this.guardianQueueId,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): GuardianQueueIdSet { return GuardianQueueIdSet.reified( ).new( { oldGuardianQueueId: decodeFromJSONField(ID.reified(), field.oldGuardianQueueId), guardianQueueId: decodeFromJSONField(ID.reified(), field.guardianQueueId) } ) }

 static fromJSON( json: Record<string, any> ): GuardianQueueIdSet { if (json.$typeName !== GuardianQueueIdSet.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return GuardianQueueIdSet.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): GuardianQueueIdSet { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isGuardianQueueIdSet(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a GuardianQueueIdSet object`); } return GuardianQueueIdSet.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): GuardianQueueIdSet { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isGuardianQueueIdSet(data.bcs.type)) { throw new Error(`object at is not a GuardianQueueIdSet object`); }

 return GuardianQueueIdSet.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return GuardianQueueIdSet.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<GuardianQueueIdSet> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching GuardianQueueIdSet object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isGuardianQueueIdSet(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a GuardianQueueIdSet object`); }

 return GuardianQueueIdSet.fromSuiObjectData( res.data ); }

 }
