import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../_framework/util";
import {PKG_V1} from "../index";
import {Version} from "../version/structs";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== CpQuoter =============================== */

export function isCpQuoter(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::cpmm::CpQuoter`; }

export interface CpQuoterFields { version: ToField<Version>; offset: ToField<"u64"> }

export type CpQuoterReified = Reified< CpQuoter, CpQuoterFields >;

export class CpQuoter implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::cpmm::CpQuoter`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = CpQuoter.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::cpmm::CpQuoter`; readonly $typeArgs: []; readonly $isPhantom = CpQuoter.$isPhantom;

 readonly version: ToField<Version>; readonly offset: ToField<"u64">

 private constructor(typeArgs: [], fields: CpQuoterFields, ) { this.$fullTypeName = composeSuiType( CpQuoter.$typeName, ...typeArgs ) as `${typeof PKG_V1}::cpmm::CpQuoter`; this.$typeArgs = typeArgs;

 this.version = fields.version;; this.offset = fields.offset; }

 static reified( ): CpQuoterReified { return { typeName: CpQuoter.$typeName, fullTypeName: composeSuiType( CpQuoter.$typeName, ...[] ) as `${typeof PKG_V1}::cpmm::CpQuoter`, typeArgs: [ ] as [], isPhantom: CpQuoter.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => CpQuoter.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => CpQuoter.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => CpQuoter.fromBcs( data, ), bcs: CpQuoter.bcs, fromJSONField: (field: any) => CpQuoter.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => CpQuoter.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => CpQuoter.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => CpQuoter.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => CpQuoter.fetch( client, id, ), new: ( fields: CpQuoterFields, ) => { return new CpQuoter( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return CpQuoter.reified() }

 static phantom( ): PhantomReified<ToTypeStr<CpQuoter>> { return phantom(CpQuoter.reified( )); } static get p() { return CpQuoter.phantom() }

 static get bcs() { return bcs.struct("CpQuoter", {

 version: Version.bcs, offset: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): CpQuoter { return CpQuoter.reified( ).new( { version: decodeFromFields(Version.reified(), fields.version), offset: decodeFromFields("u64", fields.offset) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): CpQuoter { if (!isCpQuoter(item.type)) { throw new Error("not a CpQuoter type");

 }

 return CpQuoter.reified( ).new( { version: decodeFromFieldsWithTypes(Version.reified(), item.fields.version), offset: decodeFromFieldsWithTypes("u64", item.fields.offset) } ) }

 static fromBcs( data: Uint8Array ): CpQuoter { return CpQuoter.fromFields( CpQuoter.bcs.parse(data) ) }

 toJSONField() { return {

 version: this.version.toJSONField(),offset: this.offset.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): CpQuoter { return CpQuoter.reified( ).new( { version: decodeFromJSONField(Version.reified(), field.version), offset: decodeFromJSONField("u64", field.offset) } ) }

 static fromJSON( json: Record<string, any> ): CpQuoter { if (json.$typeName !== CpQuoter.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return CpQuoter.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): CpQuoter { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isCpQuoter(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a CpQuoter object`); } return CpQuoter.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): CpQuoter { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isCpQuoter(data.bcs.type)) { throw new Error(`object at is not a CpQuoter object`); }

 return CpQuoter.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return CpQuoter.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<CpQuoter> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching CpQuoter object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isCpQuoter(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a CpQuoter object`); }

 return CpQuoter.fromSuiObjectData( res.data ); }

 }
