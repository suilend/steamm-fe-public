import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {ID, UID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== State =============================== */

export function isState(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::on_demand::State`; }

export interface StateFields { id: ToField<UID>; oracleQueue: ToField<ID>; guardianQueue: ToField<ID>; onDemandPackageId: ToField<ID> }

export type StateReified = Reified< State, StateFields >;

export class State implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::on_demand::State`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = State.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::on_demand::State`; readonly $typeArgs: []; readonly $isPhantom = State.$isPhantom;

 readonly id: ToField<UID>; readonly oracleQueue: ToField<ID>; readonly guardianQueue: ToField<ID>; readonly onDemandPackageId: ToField<ID>

 private constructor(typeArgs: [], fields: StateFields, ) { this.$fullTypeName = composeSuiType( State.$typeName, ...typeArgs ) as `${typeof PKG_V1}::on_demand::State`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.oracleQueue = fields.oracleQueue;; this.guardianQueue = fields.guardianQueue;; this.onDemandPackageId = fields.onDemandPackageId; }

 static reified( ): StateReified { return { typeName: State.$typeName, fullTypeName: composeSuiType( State.$typeName, ...[] ) as `${typeof PKG_V1}::on_demand::State`, typeArgs: [ ] as [], isPhantom: State.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => State.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => State.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => State.fromBcs( data, ), bcs: State.bcs, fromJSONField: (field: any) => State.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => State.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => State.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => State.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => State.fetch( client, id, ), new: ( fields: StateFields, ) => { return new State( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return State.reified() }

 static phantom( ): PhantomReified<ToTypeStr<State>> { return phantom(State.reified( )); } static get p() { return State.phantom() }

 static get bcs() { return bcs.struct("State", {

 id: UID.bcs, oracleQueue: ID.bcs, guardianQueue: ID.bcs, onDemandPackageId: ID.bcs

}) };

 static fromFields( fields: Record<string, any> ): State { return State.reified( ).new( { id: decodeFromFields(UID.reified(), fields.id), oracleQueue: decodeFromFields(ID.reified(), fields.oracleQueue), guardianQueue: decodeFromFields(ID.reified(), fields.guardianQueue), onDemandPackageId: decodeFromFields(ID.reified(), fields.onDemandPackageId) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): State { if (!isState(item.type)) { throw new Error("not a State type");

 }

 return State.reified( ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), oracleQueue: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracleQueue), guardianQueue: decodeFromFieldsWithTypes(ID.reified(), item.fields.guardianQueue), onDemandPackageId: decodeFromFieldsWithTypes(ID.reified(), item.fields.onDemandPackageId) } ) }

 static fromBcs( data: Uint8Array ): State { return State.fromFields( State.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,oracleQueue: this.oracleQueue,guardianQueue: this.guardianQueue,onDemandPackageId: this.onDemandPackageId,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): State { return State.reified( ).new( { id: decodeFromJSONField(UID.reified(), field.id), oracleQueue: decodeFromJSONField(ID.reified(), field.oracleQueue), guardianQueue: decodeFromJSONField(ID.reified(), field.guardianQueue), onDemandPackageId: decodeFromJSONField(ID.reified(), field.onDemandPackageId) } ) }

 static fromJSON( json: Record<string, any> ): State { if (json.$typeName !== State.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return State.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): State { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isState(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a State object`); } return State.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): State { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isState(data.bcs.type)) { throw new Error(`object at is not a State object`); }

 return State.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return State.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<State> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching State object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isState(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a State object`); }

 return State.fromSuiObjectData( res.data ); }

 }

/* ============================== AdminCap =============================== */

export function isAdminCap(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::on_demand::AdminCap`; }

export interface AdminCapFields { id: ToField<UID> }

export type AdminCapReified = Reified< AdminCap, AdminCapFields >;

export class AdminCap implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::on_demand::AdminCap`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = AdminCap.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::on_demand::AdminCap`; readonly $typeArgs: []; readonly $isPhantom = AdminCap.$isPhantom;

 readonly id: ToField<UID>

 private constructor(typeArgs: [], fields: AdminCapFields, ) { this.$fullTypeName = composeSuiType( AdminCap.$typeName, ...typeArgs ) as `${typeof PKG_V1}::on_demand::AdminCap`; this.$typeArgs = typeArgs;

 this.id = fields.id; }

 static reified( ): AdminCapReified { return { typeName: AdminCap.$typeName, fullTypeName: composeSuiType( AdminCap.$typeName, ...[] ) as `${typeof PKG_V1}::on_demand::AdminCap`, typeArgs: [ ] as [], isPhantom: AdminCap.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => AdminCap.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => AdminCap.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => AdminCap.fromBcs( data, ), bcs: AdminCap.bcs, fromJSONField: (field: any) => AdminCap.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => AdminCap.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => AdminCap.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => AdminCap.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => AdminCap.fetch( client, id, ), new: ( fields: AdminCapFields, ) => { return new AdminCap( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return AdminCap.reified() }

 static phantom( ): PhantomReified<ToTypeStr<AdminCap>> { return phantom(AdminCap.reified( )); } static get p() { return AdminCap.phantom() }

 static get bcs() { return bcs.struct("AdminCap", {

 id: UID.bcs

}) };

 static fromFields( fields: Record<string, any> ): AdminCap { return AdminCap.reified( ).new( { id: decodeFromFields(UID.reified(), fields.id) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): AdminCap { if (!isAdminCap(item.type)) { throw new Error("not a AdminCap type");

 }

 return AdminCap.reified( ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id) } ) }

 static fromBcs( data: Uint8Array ): AdminCap { return AdminCap.fromFields( AdminCap.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): AdminCap { return AdminCap.reified( ).new( { id: decodeFromJSONField(UID.reified(), field.id) } ) }

 static fromJSON( json: Record<string, any> ): AdminCap { if (json.$typeName !== AdminCap.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return AdminCap.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): AdminCap { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAdminCap(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a AdminCap object`); } return AdminCap.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): AdminCap { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAdminCap(data.bcs.type)) { throw new Error(`object at is not a AdminCap object`); }

 return AdminCap.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return AdminCap.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<AdminCap> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching AdminCap object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAdminCap(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a AdminCap object`); }

 return AdminCap.fromSuiObjectData( res.data ); }

 }

/* ============================== ON_DEMAND =============================== */

export function isON_DEMAND(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::on_demand::ON_DEMAND`; }

export interface ON_DEMANDFields { dummyField: ToField<"bool"> }

export type ON_DEMANDReified = Reified< ON_DEMAND, ON_DEMANDFields >;

export class ON_DEMAND implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::on_demand::ON_DEMAND`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = ON_DEMAND.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::on_demand::ON_DEMAND`; readonly $typeArgs: []; readonly $isPhantom = ON_DEMAND.$isPhantom;

 readonly dummyField: ToField<"bool">

 private constructor(typeArgs: [], fields: ON_DEMANDFields, ) { this.$fullTypeName = composeSuiType( ON_DEMAND.$typeName, ...typeArgs ) as `${typeof PKG_V1}::on_demand::ON_DEMAND`; this.$typeArgs = typeArgs;

 this.dummyField = fields.dummyField; }

 static reified( ): ON_DEMANDReified { return { typeName: ON_DEMAND.$typeName, fullTypeName: composeSuiType( ON_DEMAND.$typeName, ...[] ) as `${typeof PKG_V1}::on_demand::ON_DEMAND`, typeArgs: [ ] as [], isPhantom: ON_DEMAND.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => ON_DEMAND.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => ON_DEMAND.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => ON_DEMAND.fromBcs( data, ), bcs: ON_DEMAND.bcs, fromJSONField: (field: any) => ON_DEMAND.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => ON_DEMAND.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => ON_DEMAND.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => ON_DEMAND.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => ON_DEMAND.fetch( client, id, ), new: ( fields: ON_DEMANDFields, ) => { return new ON_DEMAND( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return ON_DEMAND.reified() }

 static phantom( ): PhantomReified<ToTypeStr<ON_DEMAND>> { return phantom(ON_DEMAND.reified( )); } static get p() { return ON_DEMAND.phantom() }

 static get bcs() { return bcs.struct("ON_DEMAND", {

 dummyField: bcs.bool()

}) };

 static fromFields( fields: Record<string, any> ): ON_DEMAND { return ON_DEMAND.reified( ).new( { dummyField: decodeFromFields("bool", fields.dummyField) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): ON_DEMAND { if (!isON_DEMAND(item.type)) { throw new Error("not a ON_DEMAND type");

 }

 return ON_DEMAND.reified( ).new( { dummyField: decodeFromFieldsWithTypes("bool", item.fields.dummyField) } ) }

 static fromBcs( data: Uint8Array ): ON_DEMAND { return ON_DEMAND.fromFields( ON_DEMAND.bcs.parse(data) ) }

 toJSONField() { return {

 dummyField: this.dummyField,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): ON_DEMAND { return ON_DEMAND.reified( ).new( { dummyField: decodeFromJSONField("bool", field.dummyField) } ) }

 static fromJSON( json: Record<string, any> ): ON_DEMAND { if (json.$typeName !== ON_DEMAND.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return ON_DEMAND.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): ON_DEMAND { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isON_DEMAND(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a ON_DEMAND object`); } return ON_DEMAND.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): ON_DEMAND { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isON_DEMAND(data.bcs.type)) { throw new Error(`object at is not a ON_DEMAND object`); }

 return ON_DEMAND.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return ON_DEMAND.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<ON_DEMAND> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching ON_DEMAND object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isON_DEMAND(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a ON_DEMAND object`); }

 return ON_DEMAND.fromSuiObjectData( res.data ); }

 }
