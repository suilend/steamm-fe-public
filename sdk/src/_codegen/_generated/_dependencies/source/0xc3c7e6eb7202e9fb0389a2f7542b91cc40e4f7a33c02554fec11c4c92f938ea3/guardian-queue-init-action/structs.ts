import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== GuardianQueueCreated =============================== */

export function isGuardianQueueCreated(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::guardian_queue_init_action::GuardianQueueCreated`; }

export interface GuardianQueueCreatedFields { queueId: ToField<ID>; queueKey: ToField<Vector<"u8">> }

export type GuardianQueueCreatedReified = Reified< GuardianQueueCreated, GuardianQueueCreatedFields >;

export class GuardianQueueCreated implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::guardian_queue_init_action::GuardianQueueCreated`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = GuardianQueueCreated.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::guardian_queue_init_action::GuardianQueueCreated`; readonly $typeArgs: []; readonly $isPhantom = GuardianQueueCreated.$isPhantom;

 readonly queueId: ToField<ID>; readonly queueKey: ToField<Vector<"u8">>

 private constructor(typeArgs: [], fields: GuardianQueueCreatedFields, ) { this.$fullTypeName = composeSuiType( GuardianQueueCreated.$typeName, ...typeArgs ) as `${typeof PKG_V1}::guardian_queue_init_action::GuardianQueueCreated`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.queueKey = fields.queueKey; }

 static reified( ): GuardianQueueCreatedReified { return { typeName: GuardianQueueCreated.$typeName, fullTypeName: composeSuiType( GuardianQueueCreated.$typeName, ...[] ) as `${typeof PKG_V1}::guardian_queue_init_action::GuardianQueueCreated`, typeArgs: [ ] as [], isPhantom: GuardianQueueCreated.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => GuardianQueueCreated.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => GuardianQueueCreated.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => GuardianQueueCreated.fromBcs( data, ), bcs: GuardianQueueCreated.bcs, fromJSONField: (field: any) => GuardianQueueCreated.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => GuardianQueueCreated.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => GuardianQueueCreated.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => GuardianQueueCreated.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => GuardianQueueCreated.fetch( client, id, ), new: ( fields: GuardianQueueCreatedFields, ) => { return new GuardianQueueCreated( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return GuardianQueueCreated.reified() }

 static phantom( ): PhantomReified<ToTypeStr<GuardianQueueCreated>> { return phantom(GuardianQueueCreated.reified( )); } static get p() { return GuardianQueueCreated.phantom() }

 static get bcs() { return bcs.struct("GuardianQueueCreated", {

 queueId: ID.bcs, queueKey: bcs.vector(bcs.u8())

}) };

 static fromFields( fields: Record<string, any> ): GuardianQueueCreated { return GuardianQueueCreated.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), queueKey: decodeFromFields(reified.vector("u8"), fields.queueKey) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): GuardianQueueCreated { if (!isGuardianQueueCreated(item.type)) { throw new Error("not a GuardianQueueCreated type");

 }

 return GuardianQueueCreated.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), queueKey: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.queueKey) } ) }

 static fromBcs( data: Uint8Array ): GuardianQueueCreated { return GuardianQueueCreated.fromFields( GuardianQueueCreated.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,queueKey: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.queueKey),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): GuardianQueueCreated { return GuardianQueueCreated.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), queueKey: decodeFromJSONField(reified.vector("u8"), field.queueKey) } ) }

 static fromJSON( json: Record<string, any> ): GuardianQueueCreated { if (json.$typeName !== GuardianQueueCreated.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return GuardianQueueCreated.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): GuardianQueueCreated { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isGuardianQueueCreated(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a GuardianQueueCreated object`); } return GuardianQueueCreated.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): GuardianQueueCreated { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isGuardianQueueCreated(data.bcs.type)) { throw new Error(`object at is not a GuardianQueueCreated object`); }

 return GuardianQueueCreated.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return GuardianQueueCreated.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<GuardianQueueCreated> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching GuardianQueueCreated object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isGuardianQueueCreated(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a GuardianQueueCreated object`); }

 return GuardianQueueCreated.fromSuiObjectData( res.data ); }

 }
