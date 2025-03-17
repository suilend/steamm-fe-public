import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== Hasher =============================== */

export function isHasher(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::hash::Hasher`; }

export interface HasherFields { buffer: ToField<Vector<"u8">> }

export type HasherReified = Reified< Hasher, HasherFields >;

export class Hasher implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::hash::Hasher`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Hasher.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::hash::Hasher`; readonly $typeArgs: []; readonly $isPhantom = Hasher.$isPhantom;

 readonly buffer: ToField<Vector<"u8">>

 private constructor(typeArgs: [], fields: HasherFields, ) { this.$fullTypeName = composeSuiType( Hasher.$typeName, ...typeArgs ) as `${typeof PKG_V1}::hash::Hasher`; this.$typeArgs = typeArgs;

 this.buffer = fields.buffer; }

 static reified( ): HasherReified { return { typeName: Hasher.$typeName, fullTypeName: composeSuiType( Hasher.$typeName, ...[] ) as `${typeof PKG_V1}::hash::Hasher`, typeArgs: [ ] as [], isPhantom: Hasher.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Hasher.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Hasher.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Hasher.fromBcs( data, ), bcs: Hasher.bcs, fromJSONField: (field: any) => Hasher.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Hasher.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Hasher.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Hasher.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Hasher.fetch( client, id, ), new: ( fields: HasherFields, ) => { return new Hasher( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Hasher.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Hasher>> { return phantom(Hasher.reified( )); } static get p() { return Hasher.phantom() }

 static get bcs() { return bcs.struct("Hasher", {

 buffer: bcs.vector(bcs.u8())

}) };

 static fromFields( fields: Record<string, any> ): Hasher { return Hasher.reified( ).new( { buffer: decodeFromFields(reified.vector("u8"), fields.buffer) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Hasher { if (!isHasher(item.type)) { throw new Error("not a Hasher type");

 }

 return Hasher.reified( ).new( { buffer: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.buffer) } ) }

 static fromBcs( data: Uint8Array ): Hasher { return Hasher.fromFields( Hasher.bcs.parse(data) ) }

 toJSONField() { return {

 buffer: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.buffer),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Hasher { return Hasher.reified( ).new( { buffer: decodeFromJSONField(reified.vector("u8"), field.buffer) } ) }

 static fromJSON( json: Record<string, any> ): Hasher { if (json.$typeName !== Hasher.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Hasher.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Hasher { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isHasher(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Hasher object`); } return Hasher.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Hasher { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isHasher(data.bcs.type)) { throw new Error(`object at is not a Hasher object`); }

 return Hasher.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Hasher.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Hasher> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Hasher object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isHasher(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Hasher object`); }

 return Hasher.fromSuiObjectData( res.data ); }

 }
