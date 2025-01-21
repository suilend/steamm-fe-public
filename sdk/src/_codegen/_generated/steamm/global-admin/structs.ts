import {UID} from "../../_dependencies/source/0x2/object/structs";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../_framework/util";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== GlobalAdmin =============================== */

export function isGlobalAdmin(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::global_admin::GlobalAdmin`; }

export interface GlobalAdminFields { id: ToField<UID> }

export type GlobalAdminReified = Reified< GlobalAdmin, GlobalAdminFields >;

export class GlobalAdmin implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::global_admin::GlobalAdmin`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = GlobalAdmin.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::global_admin::GlobalAdmin`; readonly $typeArgs: []; readonly $isPhantom = GlobalAdmin.$isPhantom;

 readonly id: ToField<UID>

 private constructor(typeArgs: [], fields: GlobalAdminFields, ) { this.$fullTypeName = composeSuiType( GlobalAdmin.$typeName, ...typeArgs ) as `${typeof PKG_V1}::global_admin::GlobalAdmin`; this.$typeArgs = typeArgs;

 this.id = fields.id; }

 static reified( ): GlobalAdminReified { return { typeName: GlobalAdmin.$typeName, fullTypeName: composeSuiType( GlobalAdmin.$typeName, ...[] ) as `${typeof PKG_V1}::global_admin::GlobalAdmin`, typeArgs: [ ] as [], isPhantom: GlobalAdmin.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => GlobalAdmin.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => GlobalAdmin.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => GlobalAdmin.fromBcs( data, ), bcs: GlobalAdmin.bcs, fromJSONField: (field: any) => GlobalAdmin.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => GlobalAdmin.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => GlobalAdmin.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => GlobalAdmin.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => GlobalAdmin.fetch( client, id, ), new: ( fields: GlobalAdminFields, ) => { return new GlobalAdmin( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return GlobalAdmin.reified() }

 static phantom( ): PhantomReified<ToTypeStr<GlobalAdmin>> { return phantom(GlobalAdmin.reified( )); } static get p() { return GlobalAdmin.phantom() }

 static get bcs() { return bcs.struct("GlobalAdmin", {

 id: UID.bcs

}) };

 static fromFields( fields: Record<string, any> ): GlobalAdmin { return GlobalAdmin.reified( ).new( { id: decodeFromFields(UID.reified(), fields.id) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): GlobalAdmin { if (!isGlobalAdmin(item.type)) { throw new Error("not a GlobalAdmin type");

 }

 return GlobalAdmin.reified( ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id) } ) }

 static fromBcs( data: Uint8Array ): GlobalAdmin { return GlobalAdmin.fromFields( GlobalAdmin.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): GlobalAdmin { return GlobalAdmin.reified( ).new( { id: decodeFromJSONField(UID.reified(), field.id) } ) }

 static fromJSON( json: Record<string, any> ): GlobalAdmin { if (json.$typeName !== GlobalAdmin.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return GlobalAdmin.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): GlobalAdmin { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isGlobalAdmin(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a GlobalAdmin object`); } return GlobalAdmin.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): GlobalAdmin { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isGlobalAdmin(data.bcs.type)) { throw new Error(`object at is not a GlobalAdmin object`); }

 return GlobalAdmin.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return GlobalAdmin.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<GlobalAdmin> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching GlobalAdmin object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isGlobalAdmin(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a GlobalAdmin object`); }

 return GlobalAdmin.fromSuiObjectData( res.data ); }

 }
