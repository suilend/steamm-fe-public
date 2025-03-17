import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== OnDemandPackageIdSet =============================== */

export function isOnDemandPackageIdSet(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::set_package_id_action::OnDemandPackageIdSet`; }

export interface OnDemandPackageIdSetFields { oldOnDemandPackageId: ToField<ID>; onDemandPackageId: ToField<ID> }

export type OnDemandPackageIdSetReified = Reified< OnDemandPackageIdSet, OnDemandPackageIdSetFields >;

export class OnDemandPackageIdSet implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::set_package_id_action::OnDemandPackageIdSet`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = OnDemandPackageIdSet.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::set_package_id_action::OnDemandPackageIdSet`; readonly $typeArgs: []; readonly $isPhantom = OnDemandPackageIdSet.$isPhantom;

 readonly oldOnDemandPackageId: ToField<ID>; readonly onDemandPackageId: ToField<ID>

 private constructor(typeArgs: [], fields: OnDemandPackageIdSetFields, ) { this.$fullTypeName = composeSuiType( OnDemandPackageIdSet.$typeName, ...typeArgs ) as `${typeof PKG_V1}::set_package_id_action::OnDemandPackageIdSet`; this.$typeArgs = typeArgs;

 this.oldOnDemandPackageId = fields.oldOnDemandPackageId;; this.onDemandPackageId = fields.onDemandPackageId; }

 static reified( ): OnDemandPackageIdSetReified { return { typeName: OnDemandPackageIdSet.$typeName, fullTypeName: composeSuiType( OnDemandPackageIdSet.$typeName, ...[] ) as `${typeof PKG_V1}::set_package_id_action::OnDemandPackageIdSet`, typeArgs: [ ] as [], isPhantom: OnDemandPackageIdSet.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => OnDemandPackageIdSet.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => OnDemandPackageIdSet.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => OnDemandPackageIdSet.fromBcs( data, ), bcs: OnDemandPackageIdSet.bcs, fromJSONField: (field: any) => OnDemandPackageIdSet.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => OnDemandPackageIdSet.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => OnDemandPackageIdSet.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => OnDemandPackageIdSet.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => OnDemandPackageIdSet.fetch( client, id, ), new: ( fields: OnDemandPackageIdSetFields, ) => { return new OnDemandPackageIdSet( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return OnDemandPackageIdSet.reified() }

 static phantom( ): PhantomReified<ToTypeStr<OnDemandPackageIdSet>> { return phantom(OnDemandPackageIdSet.reified( )); } static get p() { return OnDemandPackageIdSet.phantom() }

 static get bcs() { return bcs.struct("OnDemandPackageIdSet", {

 oldOnDemandPackageId: ID.bcs, onDemandPackageId: ID.bcs

}) };

 static fromFields( fields: Record<string, any> ): OnDemandPackageIdSet { return OnDemandPackageIdSet.reified( ).new( { oldOnDemandPackageId: decodeFromFields(ID.reified(), fields.oldOnDemandPackageId), onDemandPackageId: decodeFromFields(ID.reified(), fields.onDemandPackageId) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): OnDemandPackageIdSet { if (!isOnDemandPackageIdSet(item.type)) { throw new Error("not a OnDemandPackageIdSet type");

 }

 return OnDemandPackageIdSet.reified( ).new( { oldOnDemandPackageId: decodeFromFieldsWithTypes(ID.reified(), item.fields.oldOnDemandPackageId), onDemandPackageId: decodeFromFieldsWithTypes(ID.reified(), item.fields.onDemandPackageId) } ) }

 static fromBcs( data: Uint8Array ): OnDemandPackageIdSet { return OnDemandPackageIdSet.fromFields( OnDemandPackageIdSet.bcs.parse(data) ) }

 toJSONField() { return {

 oldOnDemandPackageId: this.oldOnDemandPackageId,onDemandPackageId: this.onDemandPackageId,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): OnDemandPackageIdSet { return OnDemandPackageIdSet.reified( ).new( { oldOnDemandPackageId: decodeFromJSONField(ID.reified(), field.oldOnDemandPackageId), onDemandPackageId: decodeFromJSONField(ID.reified(), field.onDemandPackageId) } ) }

 static fromJSON( json: Record<string, any> ): OnDemandPackageIdSet { if (json.$typeName !== OnDemandPackageIdSet.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return OnDemandPackageIdSet.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): OnDemandPackageIdSet { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isOnDemandPackageIdSet(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a OnDemandPackageIdSet object`); } return OnDemandPackageIdSet.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): OnDemandPackageIdSet { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isOnDemandPackageIdSet(data.bcs.type)) { throw new Error(`object at is not a OnDemandPackageIdSet object`); }

 return OnDemandPackageIdSet.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return OnDemandPackageIdSet.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<OnDemandPackageIdSet> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching OnDemandPackageIdSet object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isOnDemandPackageIdSet(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a OnDemandPackageIdSet object`); }

 return OnDemandPackageIdSet.fromSuiObjectData( res.data ); }

 }
