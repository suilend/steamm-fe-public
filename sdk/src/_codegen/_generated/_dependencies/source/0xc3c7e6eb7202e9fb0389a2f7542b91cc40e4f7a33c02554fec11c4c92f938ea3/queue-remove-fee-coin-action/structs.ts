import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {TypeName} from "../../0x1/type-name/structs";
import {ID} from "../../0x2/object/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== QueueFeeTypeRemoved =============================== */

export function isQueueFeeTypeRemoved(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::queue_remove_fee_coin_action::QueueFeeTypeRemoved`; }

export interface QueueFeeTypeRemovedFields { queueId: ToField<ID>; feeType: ToField<TypeName> }

export type QueueFeeTypeRemovedReified = Reified< QueueFeeTypeRemoved, QueueFeeTypeRemovedFields >;

export class QueueFeeTypeRemoved implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::queue_remove_fee_coin_action::QueueFeeTypeRemoved`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = QueueFeeTypeRemoved.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::queue_remove_fee_coin_action::QueueFeeTypeRemoved`; readonly $typeArgs: []; readonly $isPhantom = QueueFeeTypeRemoved.$isPhantom;

 readonly queueId: ToField<ID>; readonly feeType: ToField<TypeName>

 private constructor(typeArgs: [], fields: QueueFeeTypeRemovedFields, ) { this.$fullTypeName = composeSuiType( QueueFeeTypeRemoved.$typeName, ...typeArgs ) as `${typeof PKG_V1}::queue_remove_fee_coin_action::QueueFeeTypeRemoved`; this.$typeArgs = typeArgs;

 this.queueId = fields.queueId;; this.feeType = fields.feeType; }

 static reified( ): QueueFeeTypeRemovedReified { return { typeName: QueueFeeTypeRemoved.$typeName, fullTypeName: composeSuiType( QueueFeeTypeRemoved.$typeName, ...[] ) as `${typeof PKG_V1}::queue_remove_fee_coin_action::QueueFeeTypeRemoved`, typeArgs: [ ] as [], isPhantom: QueueFeeTypeRemoved.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => QueueFeeTypeRemoved.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => QueueFeeTypeRemoved.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => QueueFeeTypeRemoved.fromBcs( data, ), bcs: QueueFeeTypeRemoved.bcs, fromJSONField: (field: any) => QueueFeeTypeRemoved.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => QueueFeeTypeRemoved.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => QueueFeeTypeRemoved.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => QueueFeeTypeRemoved.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => QueueFeeTypeRemoved.fetch( client, id, ), new: ( fields: QueueFeeTypeRemovedFields, ) => { return new QueueFeeTypeRemoved( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return QueueFeeTypeRemoved.reified() }

 static phantom( ): PhantomReified<ToTypeStr<QueueFeeTypeRemoved>> { return phantom(QueueFeeTypeRemoved.reified( )); } static get p() { return QueueFeeTypeRemoved.phantom() }

 static get bcs() { return bcs.struct("QueueFeeTypeRemoved", {

 queueId: ID.bcs, feeType: TypeName.bcs

}) };

 static fromFields( fields: Record<string, any> ): QueueFeeTypeRemoved { return QueueFeeTypeRemoved.reified( ).new( { queueId: decodeFromFields(ID.reified(), fields.queueId), feeType: decodeFromFields(TypeName.reified(), fields.feeType) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): QueueFeeTypeRemoved { if (!isQueueFeeTypeRemoved(item.type)) { throw new Error("not a QueueFeeTypeRemoved type");

 }

 return QueueFeeTypeRemoved.reified( ).new( { queueId: decodeFromFieldsWithTypes(ID.reified(), item.fields.queueId), feeType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.feeType) } ) }

 static fromBcs( data: Uint8Array ): QueueFeeTypeRemoved { return QueueFeeTypeRemoved.fromFields( QueueFeeTypeRemoved.bcs.parse(data) ) }

 toJSONField() { return {

 queueId: this.queueId,feeType: this.feeType.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): QueueFeeTypeRemoved { return QueueFeeTypeRemoved.reified( ).new( { queueId: decodeFromJSONField(ID.reified(), field.queueId), feeType: decodeFromJSONField(TypeName.reified(), field.feeType) } ) }

 static fromJSON( json: Record<string, any> ): QueueFeeTypeRemoved { if (json.$typeName !== QueueFeeTypeRemoved.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return QueueFeeTypeRemoved.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): QueueFeeTypeRemoved { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isQueueFeeTypeRemoved(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a QueueFeeTypeRemoved object`); } return QueueFeeTypeRemoved.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): QueueFeeTypeRemoved { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isQueueFeeTypeRemoved(data.bcs.type)) { throw new Error(`object at is not a QueueFeeTypeRemoved object`); }

 return QueueFeeTypeRemoved.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return QueueFeeTypeRemoved.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<QueueFeeTypeRemoved> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching QueueFeeTypeRemoved object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isQueueFeeTypeRemoved(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a QueueFeeTypeRemoved object`); }

 return QueueFeeTypeRemoved.fromSuiObjectData( res.data ); }

 }
