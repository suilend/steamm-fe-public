import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {TypeName} from "../../0x1/type-name/structs";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== QueueFeeTypeAdded =============================== */

export function isQueueFeeTypeAdded(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue_add_fee_coin_action::QueueFeeTypeAdded`; }

export interface QueueFeeTypeAddedFields { queueId: ToField<ID>; feeType: ToField<TypeName> }

export type QueueFeeTypeAddedReified = Reified< QueueFeeTypeAdded, QueueFeeTypeAddedFields >;

export class QueueFeeTypeAdded implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue_add_fee_coin_action::QueueFeeTypeAdded`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = QueueFeeTypeAdded.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue_add_fee_coin_action::QueueFeeTypeAdded`; readonly $typeArgs: []; readonly $isPhantom = QueueFeeTypeAdded.$isPhantom;

 readonly queueId: ToField<ID>; readonly feeType: ToField<TypeName>

 private constructor(typeArgs: [], fields: QueueFeeTypeAddedFields, ) { this.$fullTypeName = composeSuiType( QueueFeeTypeAdded.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue_add_fee_coin_action::QueueFeeTypeAdded`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.feeType = fields.feeType; }

 static reified( ): QueueFeeTypeAddedReified { return { typeName: QueueFeeTypeAdded.$typeName, fullTypeName: composeSuiType( QueueFeeTypeAdded.$typeName, ...[] ) as `${typeof PKG_V1}::queue_add_fee_coin_action::QueueFeeTypeAdded`, typeArgs: [ ] as [], isPhantom: QueueFeeTypeAdded.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => QueueFeeTypeAdded.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => QueueFeeTypeAdded.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => QueueFeeTypeAdded.fromBcs( data, ), bcs: QueueFeeTypeAdded.bcs, fromJSONField: (field: any) => QueueFeeTypeAdded.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => QueueFeeTypeAdded.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => QueueFeeTypeAdded.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => QueueFeeTypeAdded.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => QueueFeeTypeAdded.fetch( client, id, ), new: ( fields: QueueFeeTypeAddedFields, ) => { return new QueueFeeTypeAdded( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return QueueFeeTypeAdded.reified() }

 static phantom( ): PhantomReified<ToTypeStr<QueueFeeTypeAdded>> { return phantom(QueueFeeTypeAdded.reified( )); } static get p() { return QueueFeeTypeAdded.phantom() }

 static get bcs() { return bcs.struct("QueueFeeTypeAdded", {

 queueId: ID.bcs, feeType: TypeName.bcs

}) };

 static fromFields( fields: Record<string, any> ): QueueFeeTypeAdded { return QueueFeeTypeAdded.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), feeType: decodeFromFields(TypeName.reified(), fields.feeType) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): QueueFeeTypeAdded { if (!isQueueFeeTypeAdded(item.type)) { throw new Error("not a QueueFeeTypeAdded type");

 }

 return QueueFeeTypeAdded.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), feeType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.feeType) } ) }

 static fromBcs( data: Uint8Array ): QueueFeeTypeAdded { return QueueFeeTypeAdded.fromFields( QueueFeeTypeAdded.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,feeType: this.feeType.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): QueueFeeTypeAdded { return QueueFeeTypeAdded.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), feeType: decodeFromJSONField(TypeName.reified(), field.feeType) } ) }

 static fromJSON( json: Record<string, any> ): QueueFeeTypeAdded { if (json.$typeName !== QueueFeeTypeAdded.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return QueueFeeTypeAdded.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): QueueFeeTypeAdded { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isQueueFeeTypeAdded(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a QueueFeeTypeAdded object`); } return QueueFeeTypeAdded.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): QueueFeeTypeAdded { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isQueueFeeTypeAdded(data.bcs.type)) { throw new Error(`object at is not a QueueFeeTypeAdded object`); }

 return QueueFeeTypeAdded.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return QueueFeeTypeAdded.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<QueueFeeTypeAdded> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching QueueFeeTypeAdded object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isQueueFeeTypeAdded(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a QueueFeeTypeAdded object`); }

 return QueueFeeTypeAdded.fromSuiObjectData( res.data ); }

 }
