import * as reified from "../../../../_framework/reified";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, fieldToJSON, phantom} from "../../../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../../../_framework/util";
import {Vector} from "../../../../_framework/vector";
import {String} from "../../0x1/string/structs";
import {ID, UID} from "../../0x2/object/structs";
import {Decimal} from "../decimal/structs";
import {PKG_V1} from "../index";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== Aggregator =============================== */

export function isAggregator(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator::Aggregator`; }

export interface AggregatorFields { id: ToField<UID>; queue: ToField<ID>; createdAtMs: ToField<"u64">; name: ToField<String>; authority: ToField<"address">; feedHash: ToField<Vector<"u8">>; minSampleSize: ToField<"u64">; maxStalenessSeconds: ToField<"u64">; maxVariance: ToField<"u64">; minResponses: ToField<"u32">; currentResult: ToField<CurrentResult>; updateState: ToField<UpdateState>; version: ToField<"u8"> }

export type AggregatorReified = Reified< Aggregator, AggregatorFields >;

export class Aggregator implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator::Aggregator`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Aggregator.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator::Aggregator`; readonly $typeArgs: []; readonly $isPhantom = Aggregator.$isPhantom;

 readonly id: ToField<UID>; readonly queue: ToField<ID>; readonly createdAtMs: ToField<"u64">; readonly name: ToField<String>; readonly authority: ToField<"address">; readonly feedHash: ToField<Vector<"u8">>; readonly minSampleSize: ToField<"u64">; readonly maxStalenessSeconds: ToField<"u64">; readonly maxVariance: ToField<"u64">; readonly minResponses: ToField<"u32">; readonly currentResult: ToField<CurrentResult>; readonly updateState: ToField<UpdateState>; readonly version: ToField<"u8">

 private constructor(typeArgs: [], fields: AggregatorFields, ) { this.$fullTypeName = composeSuiType( Aggregator.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator::Aggregator`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.queue = fields.queue;; this.createdAtMs = fields.createdAtMs;; this.name = fields.name;; this.authority = fields.authority;; this.feedHash = fields.feedHash;; this.minSampleSize = fields.minSampleSize;; this.maxStalenessSeconds = fields.maxStalenessSeconds;; this.maxVariance = fields.maxVariance;; this.minResponses = fields.minResponses;; this.currentResult = fields.currentResult;; this.updateState = fields.updateState;; this.version = fields.version; }

 static reified( ): AggregatorReified { return { typeName: Aggregator.$typeName, fullTypeName: composeSuiType( Aggregator.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator::Aggregator`, typeArgs: [ ] as [], isPhantom: Aggregator.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Aggregator.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Aggregator.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Aggregator.fromBcs( data, ), bcs: Aggregator.bcs, fromJSONField: (field: any) => Aggregator.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Aggregator.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Aggregator.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Aggregator.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Aggregator.fetch( client, id, ), new: ( fields: AggregatorFields, ) => { return new Aggregator( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Aggregator.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Aggregator>> { return phantom(Aggregator.reified( )); } static get p() { return Aggregator.phantom() }

 static get bcs() { return bcs.struct("Aggregator", {

 id: UID.bcs, queue: ID.bcs, createdAtMs: bcs.u64(), name: String.bcs, authority: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), feedHash: bcs.vector(bcs.u8()), minSampleSize: bcs.u64(), maxStalenessSeconds: bcs.u64(), maxVariance: bcs.u64(), minResponses: bcs.u32(), currentResult: CurrentResult.bcs, updateState: UpdateState.bcs, version: bcs.u8()

}) };

 static fromFields( fields: Record<string, any> ): Aggregator { return Aggregator.reified( ).new( { id: decodeFromFields(UID.reified(), fields.id), queue: decodeFromFields(ID.reified(), fields.queue), createdAtMs: decodeFromFields("u64", fields.createdAtMs), name: decodeFromFields(String.reified(), fields.name), authority: decodeFromFields("address", fields.authority), feedHash: decodeFromFields(reified.vector("u8"), fields.feedHash), minSampleSize: decodeFromFields("u64", fields.minSampleSize), maxStalenessSeconds: decodeFromFields("u64", fields.maxStalenessSeconds), maxVariance: decodeFromFields("u64", fields.maxVariance), minResponses: decodeFromFields("u32", fields.minResponses), currentResult: decodeFromFields(CurrentResult.reified(), fields.currentResult), updateState: decodeFromFields(UpdateState.reified(), fields.updateState), version: decodeFromFields("u8", fields.version) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Aggregator { if (!isAggregator(item.type)) { throw new Error("not a Aggregator type");

 }

 return Aggregator.reified( ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), queue: decodeFromFieldsWithTypes(ID.reified(), item.fields.queue), createdAtMs: decodeFromFieldsWithTypes("u64", item.fields.createdAtMs), name: decodeFromFieldsWithTypes(String.reified(), item.fields.name), authority: decodeFromFieldsWithTypes("address", item.fields.authority), feedHash: decodeFromFieldsWithTypes(reified.vector("u8"), item.fields.feedHash), minSampleSize: decodeFromFieldsWithTypes("u64", item.fields.minSampleSize), maxStalenessSeconds: decodeFromFieldsWithTypes("u64", item.fields.maxStalenessSeconds), maxVariance: decodeFromFieldsWithTypes("u64", item.fields.maxVariance), minResponses: decodeFromFieldsWithTypes("u32", item.fields.minResponses), currentResult: decodeFromFieldsWithTypes(CurrentResult.reified(), item.fields.currentResult), updateState: decodeFromFieldsWithTypes(UpdateState.reified(), item.fields.updateState), version: decodeFromFieldsWithTypes("u8", item.fields.version) } ) }

 static fromBcs( data: Uint8Array ): Aggregator { return Aggregator.fromFields( Aggregator.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,queue: this.queue,createdAtMs: this.createdAtMs.toString(),name: this.name,authority: this.authority,feedHash: fieldToJSON<Vector<"u8">>(`vector<u8>`, this.feedHash),minSampleSize: this.minSampleSize.toString(),maxStalenessSeconds: this.maxStalenessSeconds.toString(),maxVariance: this.maxVariance.toString(),minResponses: this.minResponses,currentResult: this.currentResult.toJSONField(),updateState: this.updateState.toJSONField(),version: this.version,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Aggregator { return Aggregator.reified( ).new( { id: decodeFromJSONField(UID.reified(), field.id), queue: decodeFromJSONField(ID.reified(), field.queue), createdAtMs: decodeFromJSONField("u64", field.createdAtMs), name: decodeFromJSONField(String.reified(), field.name), authority: decodeFromJSONField("address", field.authority), feedHash: decodeFromJSONField(reified.vector("u8"), field.feedHash), minSampleSize: decodeFromJSONField("u64", field.minSampleSize), maxStalenessSeconds: decodeFromJSONField("u64", field.maxStalenessSeconds), maxVariance: decodeFromJSONField("u64", field.maxVariance), minResponses: decodeFromJSONField("u32", field.minResponses), currentResult: decodeFromJSONField(CurrentResult.reified(), field.currentResult), updateState: decodeFromJSONField(UpdateState.reified(), field.updateState), version: decodeFromJSONField("u8", field.version) } ) }

 static fromJSON( json: Record<string, any> ): Aggregator { if (json.$typeName !== Aggregator.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Aggregator.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Aggregator { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isAggregator(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Aggregator object`); } return Aggregator.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Aggregator { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isAggregator(data.bcs.type)) { throw new Error(`object at is not a Aggregator object`); }

 return Aggregator.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Aggregator.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Aggregator> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Aggregator object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isAggregator(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Aggregator object`); }

 return Aggregator.fromSuiObjectData( res.data ); }

 }

/* ============================== CurrentResult =============================== */

export function isCurrentResult(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator::CurrentResult`; }

export interface CurrentResultFields { result: ToField<Decimal>; timestampMs: ToField<"u64">; minTimestampMs: ToField<"u64">; maxTimestampMs: ToField<"u64">; minResult: ToField<Decimal>; maxResult: ToField<Decimal>; stdev: ToField<Decimal>; range: ToField<Decimal>; mean: ToField<Decimal> }

export type CurrentResultReified = Reified< CurrentResult, CurrentResultFields >;

export class CurrentResult implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator::CurrentResult`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = CurrentResult.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator::CurrentResult`; readonly $typeArgs: []; readonly $isPhantom = CurrentResult.$isPhantom;

 readonly result: ToField<Decimal>; readonly timestampMs: ToField<"u64">; readonly minTimestampMs: ToField<"u64">; readonly maxTimestampMs: ToField<"u64">; readonly minResult: ToField<Decimal>; readonly maxResult: ToField<Decimal>; readonly stdev: ToField<Decimal>; readonly range: ToField<Decimal>; readonly mean: ToField<Decimal>

 private constructor(typeArgs: [], fields: CurrentResultFields, ) { this.$fullTypeName = composeSuiType( CurrentResult.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator::CurrentResult`; this.$typeArgs = typeArgs;

 this.result = fields.result;; this.timestampMs = fields.timestampMs;; this.minTimestampMs = fields.minTimestampMs;; this.maxTimestampMs = fields.maxTimestampMs;; this.minResult = fields.minResult;; this.maxResult = fields.maxResult;; this.stdev = fields.stdev;; this.range = fields.range;; this.mean = fields.mean; }

 static reified( ): CurrentResultReified { return { typeName: CurrentResult.$typeName, fullTypeName: composeSuiType( CurrentResult.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator::CurrentResult`, typeArgs: [ ] as [], isPhantom: CurrentResult.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => CurrentResult.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => CurrentResult.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => CurrentResult.fromBcs( data, ), bcs: CurrentResult.bcs, fromJSONField: (field: any) => CurrentResult.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => CurrentResult.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => CurrentResult.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => CurrentResult.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => CurrentResult.fetch( client, id, ), new: ( fields: CurrentResultFields, ) => { return new CurrentResult( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return CurrentResult.reified() }

 static phantom( ): PhantomReified<ToTypeStr<CurrentResult>> { return phantom(CurrentResult.reified( )); } static get p() { return CurrentResult.phantom() }

 static get bcs() { return bcs.struct("CurrentResult", {

 result: Decimal.bcs, timestampMs: bcs.u64(), minTimestampMs: bcs.u64(), maxTimestampMs: bcs.u64(), minResult: Decimal.bcs, maxResult: Decimal.bcs, stdev: Decimal.bcs, range: Decimal.bcs, mean: Decimal.bcs

}) };

 static fromFields( fields: Record<string, any> ): CurrentResult { return CurrentResult.reified( ).new( { result: decodeFromFields(Decimal.reified(), fields.result), timestampMs: decodeFromFields("u64", fields.timestampMs), minTimestampMs: decodeFromFields("u64", fields.minTimestampMs), maxTimestampMs: decodeFromFields("u64", fields.maxTimestampMs), minResult: decodeFromFields(Decimal.reified(), fields.minResult), maxResult: decodeFromFields(Decimal.reified(), fields.maxResult), stdev: decodeFromFields(Decimal.reified(), fields.stdev), range: decodeFromFields(Decimal.reified(), fields.range), mean: decodeFromFields(Decimal.reified(), fields.mean) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): CurrentResult { if (!isCurrentResult(item.type)) { throw new Error("not a CurrentResult type");

 }

 return CurrentResult.reified( ).new( { result: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.result), timestampMs: decodeFromFieldsWithTypes("u64", item.fields.timestampMs), minTimestampMs: decodeFromFieldsWithTypes("u64", item.fields.minTimestampMs), maxTimestampMs: decodeFromFieldsWithTypes("u64", item.fields.maxTimestampMs), minResult: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.minResult), maxResult: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.maxResult), stdev: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.stdev), range: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.range), mean: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.mean) } ) }

 static fromBcs( data: Uint8Array ): CurrentResult { return CurrentResult.fromFields( CurrentResult.bcs.parse(data) ) }

 toJSONField() { return {

 result: this.result.toJSONField(),timestampMs: this.timestampMs.toString(),minTimestampMs: this.minTimestampMs.toString(),maxTimestampMs: this.maxTimestampMs.toString(),minResult: this.minResult.toJSONField(),maxResult: this.maxResult.toJSONField(),stdev: this.stdev.toJSONField(),range: this.range.toJSONField(),mean: this.mean.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): CurrentResult { return CurrentResult.reified( ).new( { result: decodeFromJSONField(Decimal.reified(), field.result), timestampMs: decodeFromJSONField("u64", field.timestampMs), minTimestampMs: decodeFromJSONField("u64", field.minTimestampMs), maxTimestampMs: decodeFromJSONField("u64", field.maxTimestampMs), minResult: decodeFromJSONField(Decimal.reified(), field.minResult), maxResult: decodeFromJSONField(Decimal.reified(), field.maxResult), stdev: decodeFromJSONField(Decimal.reified(), field.stdev), range: decodeFromJSONField(Decimal.reified(), field.range), mean: decodeFromJSONField(Decimal.reified(), field.mean) } ) }

 static fromJSON( json: Record<string, any> ): CurrentResult { if (json.$typeName !== CurrentResult.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return CurrentResult.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): CurrentResult { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isCurrentResult(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a CurrentResult object`); } return CurrentResult.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): CurrentResult { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isCurrentResult(data.bcs.type)) { throw new Error(`object at is not a CurrentResult object`); }

 return CurrentResult.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return CurrentResult.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<CurrentResult> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching CurrentResult object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isCurrentResult(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a CurrentResult object`); }

 return CurrentResult.fromSuiObjectData( res.data ); }

 }

/* ============================== Update =============================== */

export function isUpdate(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator::Update`; }

export interface UpdateFields { result: ToField<Decimal>; timestampMs: ToField<"u64">; oracle: ToField<ID> }

export type UpdateReified = Reified< Update, UpdateFields >;

export class Update implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator::Update`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = Update.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator::Update`; readonly $typeArgs: []; readonly $isPhantom = Update.$isPhantom;

 readonly result: ToField<Decimal>; readonly timestampMs: ToField<"u64">; readonly oracle: ToField<ID>

 private constructor(typeArgs: [], fields: UpdateFields, ) { this.$fullTypeName = composeSuiType( Update.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator::Update`; this.$typeArgs = typeArgs;

 this.result = fields.result;; this.timestampMs = fields.timestampMs;; this.oracle = fields.oracle; }

 static reified( ): UpdateReified { return { typeName: Update.$typeName, fullTypeName: composeSuiType( Update.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator::Update`, typeArgs: [ ] as [], isPhantom: Update.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => Update.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Update.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => Update.fromBcs( data, ), bcs: Update.bcs, fromJSONField: (field: any) => Update.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => Update.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => Update.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => Update.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => Update.fetch( client, id, ), new: ( fields: UpdateFields, ) => { return new Update( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return Update.reified() }

 static phantom( ): PhantomReified<ToTypeStr<Update>> { return phantom(Update.reified( )); } static get p() { return Update.phantom() }

 static get bcs() { return bcs.struct("Update", {

 result: Decimal.bcs, timestampMs: bcs.u64(), oracle: ID.bcs

}) };

 static fromFields( fields: Record<string, any> ): Update { return Update.reified( ).new( { result: decodeFromFields(Decimal.reified(), fields.result), timestampMs: decodeFromFields("u64", fields.timestampMs), oracle: decodeFromFields(ID.reified(), fields.oracle) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): Update { if (!isUpdate(item.type)) { throw new Error("not a Update type");

 }

 return Update.reified( ).new( { result: decodeFromFieldsWithTypes(Decimal.reified(), item.fields.result), timestampMs: decodeFromFieldsWithTypes("u64", item.fields.timestampMs), oracle: decodeFromFieldsWithTypes(ID.reified(), item.fields.oracle) } ) }

 static fromBcs( data: Uint8Array ): Update { return Update.fromFields( Update.bcs.parse(data) ) }

 toJSONField() { return {

 result: this.result.toJSONField(),timestampMs: this.timestampMs.toString(),oracle: this.oracle,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): Update { return Update.reified( ).new( { result: decodeFromJSONField(Decimal.reified(), field.result), timestampMs: decodeFromJSONField("u64", field.timestampMs), oracle: decodeFromJSONField(ID.reified(), field.oracle) } ) }

 static fromJSON( json: Record<string, any> ): Update { if (json.$typeName !== Update.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return Update.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): Update { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isUpdate(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Update object`); } return Update.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): Update { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isUpdate(data.bcs.type)) { throw new Error(`object at is not a Update object`); }

 return Update.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Update.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<Update> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Update object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isUpdate(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Update object`); }

 return Update.fromSuiObjectData( res.data ); }

 }

/* ============================== UpdateState =============================== */

export function isUpdateState(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::aggregator::UpdateState`; }

export interface UpdateStateFields { results: ToField<Vector<Update>>; currIdx: ToField<"u64"> }

export type UpdateStateReified = Reified< UpdateState, UpdateStateFields >;

export class UpdateState implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::aggregator::UpdateState`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = UpdateState.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::aggregator::UpdateState`; readonly $typeArgs: []; readonly $isPhantom = UpdateState.$isPhantom;

 readonly results: ToField<Vector<Update>>; readonly currIdx: ToField<"u64">

 private constructor(typeArgs: [], fields: UpdateStateFields, ) { this.$fullTypeName = composeSuiType( UpdateState.$typeName, ...typeArgs ) as `${typeof PKG_V1}::aggregator::UpdateState`; this.$typeArgs = typeArgs;

 this.results = fields.results;; this.currIdx = fields.currIdx; }

 static reified( ): UpdateStateReified { return { typeName: UpdateState.$typeName, fullTypeName: composeSuiType( UpdateState.$typeName, ...[] ) as `${typeof PKG_V1}::aggregator::UpdateState`, typeArgs: [ ] as [], isPhantom: UpdateState.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => UpdateState.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => UpdateState.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => UpdateState.fromBcs( data, ), bcs: UpdateState.bcs, fromJSONField: (field: any) => UpdateState.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => UpdateState.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => UpdateState.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => UpdateState.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => UpdateState.fetch( client, id, ), new: ( fields: UpdateStateFields, ) => { return new UpdateState( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return UpdateState.reified() }

 static phantom( ): PhantomReified<ToTypeStr<UpdateState>> { return phantom(UpdateState.reified( )); } static get p() { return UpdateState.phantom() }

 static get bcs() { return bcs.struct("UpdateState", {

 results: bcs.vector(Update.bcs), currIdx: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): UpdateState { return UpdateState.reified( ).new( { results: decodeFromFields(reified.vector(Update.reified()), fields.results), currIdx: decodeFromFields("u64", fields.currIdx) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): UpdateState { if (!isUpdateState(item.type)) { throw new Error("not a UpdateState type");

 }

 return UpdateState.reified( ).new( { results: decodeFromFieldsWithTypes(reified.vector(Update.reified()), item.fields.results), currIdx: decodeFromFieldsWithTypes("u64", item.fields.currIdx) } ) }

 static fromBcs( data: Uint8Array ): UpdateState { return UpdateState.fromFields( UpdateState.bcs.parse(data) ) }

 toJSONField() { return {

 results: fieldToJSON<Vector<Update>>(`vector<${Update.$typeName}>`, this.results),currIdx: this.currIdx.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): UpdateState { return UpdateState.reified( ).new( { results: decodeFromJSONField(reified.vector(Update.reified()), field.results), currIdx: decodeFromJSONField("u64", field.currIdx) } ) }

 static fromJSON( json: Record<string, any> ): UpdateState { if (json.$typeName !== UpdateState.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return UpdateState.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): UpdateState { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isUpdateState(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a UpdateState object`); } return UpdateState.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): UpdateState { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isUpdateState(data.bcs.type)) { throw new Error(`object at is not a UpdateState object`); }

 return UpdateState.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return UpdateState.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<UpdateState> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching UpdateState object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isUpdateState(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a UpdateState object`); }

 return UpdateState.fromSuiObjectData( res.data ); }

 }
