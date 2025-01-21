import {Option} from "../../_dependencies/source/0x1/option/structs";
import {TypeName} from "../../_dependencies/source/0x1/type-name/structs";
import {Balance, Supply} from "../../_dependencies/source/0x2/balance/structs";
import {ID, UID} from "../../_dependencies/source/0x2/object/structs";
import {ObligationOwnerCap} from "../../_dependencies/source/0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf/lending-market/structs";
import {PhantomReified, PhantomToTypeStr, PhantomTypeArgument, Reified, StructClass, ToField, ToPhantomTypeArgument, ToTypeStr, assertFieldsWithTypesArgsMatch, assertReifiedTypeArgsMatch, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, extractType, fieldToJSON, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType, parseTypeName} from "../../_framework/util";
import {PKG_V1} from "../index";
import {Version} from "../version/structs";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64, fromHEX, toHEX} from "@mysten/sui/utils";

/* ============================== Bank =============================== */

export function isBank(type: string): boolean { type = compressSuiType(type); return type.startsWith(`${PKG_V1}::bank::Bank` + '<'); }

export interface BankFields<P extends PhantomTypeArgument, T extends PhantomTypeArgument, BToken extends PhantomTypeArgument> { id: ToField<UID>; fundsAvailable: ToField<Balance<T>>; lending: ToField<Option<Lending<P>>>; minTokenBlockSize: ToField<"u64">; btokenSupply: ToField<Supply<BToken>>; version: ToField<Version> }

export type BankReified<P extends PhantomTypeArgument, T extends PhantomTypeArgument, BToken extends PhantomTypeArgument> = Reified< Bank<P, T, BToken>, BankFields<P, T, BToken> >;

export class Bank<P extends PhantomTypeArgument, T extends PhantomTypeArgument, BToken extends PhantomTypeArgument> implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::Bank`; static readonly $numTypeParams = 3; static readonly $isPhantom = [true,true,true,] as const;

 readonly $typeName = Bank.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::Bank<${PhantomToTypeStr<P>}, ${PhantomToTypeStr<T>}, ${PhantomToTypeStr<BToken>}>`; readonly $typeArgs: [PhantomToTypeStr<P>, PhantomToTypeStr<T>, PhantomToTypeStr<BToken>]; readonly $isPhantom = Bank.$isPhantom;

 readonly id: ToField<UID>; readonly fundsAvailable: ToField<Balance<T>>; readonly lending: ToField<Option<Lending<P>>>; readonly minTokenBlockSize: ToField<"u64">; readonly btokenSupply: ToField<Supply<BToken>>; readonly version: ToField<Version>

 private constructor(typeArgs: [PhantomToTypeStr<P>, PhantomToTypeStr<T>, PhantomToTypeStr<BToken>], fields: BankFields<P, T, BToken>, ) { this.$fullTypeName = composeSuiType( Bank.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::Bank<${PhantomToTypeStr<P>}, ${PhantomToTypeStr<T>}, ${PhantomToTypeStr<BToken>}>`; this.$typeArgs = typeArgs;

 this.id = fields.id;; this.fundsAvailable = fields.fundsAvailable;; this.lending = fields.lending;; this.minTokenBlockSize = fields.minTokenBlockSize;; this.btokenSupply = fields.btokenSupply;; this.version = fields.version; }

 static reified<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( P: P, T: T, BToken: BToken ): BankReified<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { return { typeName: Bank.$typeName, fullTypeName: composeSuiType( Bank.$typeName, ...[extractType(P), extractType(T), extractType(BToken)] ) as `${typeof PKG_V1}::bank::Bank<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<T>>}, ${PhantomToTypeStr<ToPhantomTypeArgument<BToken>>}>`, typeArgs: [ extractType(P), extractType(T), extractType(BToken) ] as [PhantomToTypeStr<ToPhantomTypeArgument<P>>, PhantomToTypeStr<ToPhantomTypeArgument<T>>, PhantomToTypeStr<ToPhantomTypeArgument<BToken>>], isPhantom: Bank.$isPhantom, reifiedTypeArgs: [P, T, BToken], fromFields: (fields: Record<string, any>) => Bank.fromFields( [P, T, BToken], fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Bank.fromFieldsWithTypes( [P, T, BToken], item, ), fromBcs: (data: Uint8Array) => Bank.fromBcs( [P, T, BToken], data, ), bcs: Bank.bcs, fromJSONField: (field: any) => Bank.fromJSONField( [P, T, BToken], field, ), fromJSON: (json: Record<string, any>) => Bank.fromJSON( [P, T, BToken], json, ), fromSuiParsedData: (content: SuiParsedData) => Bank.fromSuiParsedData( [P, T, BToken], content, ), fromSuiObjectData: (content: SuiObjectData) => Bank.fromSuiObjectData( [P, T, BToken], content, ), fetch: async (client: SuiClient, id: string) => Bank.fetch( client, [P, T, BToken], id, ), new: ( fields: BankFields<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>>, ) => { return new Bank( [extractType(P), extractType(T), extractType(BToken)], fields ) }, kind: "StructClassReified", } }

 static get r() { return Bank.reified }

 static phantom<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( P: P, T: T, BToken: BToken ): PhantomReified<ToTypeStr<Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>>>> { return phantom(Bank.reified( P, T, BToken )); } static get p() { return Bank.phantom }

 static get bcs() { return bcs.struct("Bank", {

 id: UID.bcs, funds_available: Balance.bcs, lending: Option.bcs(Lending.bcs), min_token_block_size: bcs.u64(), btoken_supply: Supply.bcs, version: Version.bcs

}) };

 static fromFields<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], fields: Record<string, any> ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { return Bank.reified( typeArgs[0], typeArgs[1], typeArgs[2], ).new( { id: decodeFromFields(UID.reified(), fields.id), fundsAvailable: decodeFromFields(Balance.reified(typeArgs[1]), fields.funds_available), lending: decodeFromFields(Option.reified(Lending.reified(typeArgs[0])), fields.lending), minTokenBlockSize: decodeFromFields("u64", fields.min_token_block_size), btokenSupply: decodeFromFields(Supply.reified(typeArgs[2]), fields.btoken_supply), version: decodeFromFields(Version.reified(), fields.version) } ) }

 static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], item: FieldsWithTypes ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { if (!isBank(item.type)) { throw new Error("not a Bank type");

 } assertFieldsWithTypesArgsMatch(item, typeArgs);

 return Bank.reified( typeArgs[0], typeArgs[1], typeArgs[2], ).new( { id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), fundsAvailable: decodeFromFieldsWithTypes(Balance.reified(typeArgs[1]), item.fields.funds_available), lending: decodeFromFieldsWithTypes(Option.reified(Lending.reified(typeArgs[0])), item.fields.lending), minTokenBlockSize: decodeFromFieldsWithTypes("u64", item.fields.min_token_block_size), btokenSupply: decodeFromFieldsWithTypes(Supply.reified(typeArgs[2]), item.fields.btoken_supply), version: decodeFromFieldsWithTypes(Version.reified(), item.fields.version) } ) }

 static fromBcs<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], data: Uint8Array ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { return Bank.fromFields( typeArgs, Bank.bcs.parse(data) ) }

 toJSONField() { return {

 id: this.id,fundsAvailable: this.fundsAvailable.toJSONField(),lending: fieldToJSON<Option<Lending<P>>>(`${Option.$typeName}<${Lending.$typeName}<${this.$typeArgs[0]}>>`, this.lending),minTokenBlockSize: this.minTokenBlockSize.toString(),btokenSupply: this.btokenSupply.toJSONField(),version: this.version.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], field: any ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { return Bank.reified( typeArgs[0], typeArgs[1], typeArgs[2], ).new( { id: decodeFromJSONField(UID.reified(), field.id), fundsAvailable: decodeFromJSONField(Balance.reified(typeArgs[1]), field.fundsAvailable), lending: decodeFromJSONField(Option.reified(Lending.reified(typeArgs[0])), field.lending), minTokenBlockSize: decodeFromJSONField("u64", field.minTokenBlockSize), btokenSupply: decodeFromJSONField(Supply.reified(typeArgs[2]), field.btokenSupply), version: decodeFromJSONField(Version.reified(), field.version) } ) }

 static fromJSON<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], json: Record<string, any> ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { if (json.$typeName !== Bank.$typeName) { throw new Error("not a WithTwoGenerics json object") }; assertReifiedTypeArgsMatch( composeSuiType(Bank.$typeName, ...typeArgs.map(extractType)), json.$typeArgs, typeArgs, )

 return Bank.fromJSONField( typeArgs, json, ) }

 static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], content: SuiParsedData ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isBank(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Bank object`); } return Bank.fromFieldsWithTypes( typeArgs, content ); }

 static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( typeArgs: [P, T, BToken], data: SuiObjectData ): Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>> { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isBank(data.bcs.type)) { throw new Error(`object at is not a Bank object`); }

 const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs; if (gotTypeArgs.length !== 3) { throw new Error(`type argument mismatch: expected 3 type arguments but got ${gotTypeArgs.length}`); }; for (let i = 0; i < 3; i++) { const gotTypeArg = compressSuiType(gotTypeArgs[i]); const expectedTypeArg = compressSuiType(extractType(typeArgs[i])); if (gotTypeArg !== expectedTypeArg) { throw new Error(`type argument mismatch at position ${i}: expected '${expectedTypeArg}' but got '${gotTypeArg}'`); } };

 return Bank.fromBcs( typeArgs, fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Bank.fromSuiParsedData( typeArgs, data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch<P extends PhantomReified<PhantomTypeArgument>, T extends PhantomReified<PhantomTypeArgument>, BToken extends PhantomReified<PhantomTypeArgument>>( client: SuiClient, typeArgs: [P, T, BToken], id: string ): Promise<Bank<ToPhantomTypeArgument<P>, ToPhantomTypeArgument<T>, ToPhantomTypeArgument<BToken>>> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Bank object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isBank(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Bank object`); }

 return Bank.fromSuiObjectData( typeArgs, res.data ); }

 }

/* ============================== BurnBTokenEvent =============================== */

export function isBurnBTokenEvent(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::bank::BurnBTokenEvent`; }

export interface BurnBTokenEventFields { user: ToField<"address">; bankId: ToField<ID>; lendingMarketId: ToField<ID>; withdrawnAmount: ToField<"u64">; burnedAmount: ToField<"u64"> }

export type BurnBTokenEventReified = Reified< BurnBTokenEvent, BurnBTokenEventFields >;

export class BurnBTokenEvent implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::BurnBTokenEvent`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = BurnBTokenEvent.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::BurnBTokenEvent`; readonly $typeArgs: []; readonly $isPhantom = BurnBTokenEvent.$isPhantom;

 readonly user: ToField<"address">; readonly bankId: ToField<ID>; readonly lendingMarketId: ToField<ID>; readonly withdrawnAmount: ToField<"u64">; readonly burnedAmount: ToField<"u64">

 private constructor(typeArgs: [], fields: BurnBTokenEventFields, ) { this.$fullTypeName = composeSuiType( BurnBTokenEvent.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::BurnBTokenEvent`; this.$typeArgs = typeArgs;

 this.user = fields.user;; this.bankId = fields.bankId;; this.lendingMarketId = fields.lendingMarketId;; this.withdrawnAmount = fields.withdrawnAmount;; this.burnedAmount = fields.burnedAmount; }

 static reified( ): BurnBTokenEventReified { return { typeName: BurnBTokenEvent.$typeName, fullTypeName: composeSuiType( BurnBTokenEvent.$typeName, ...[] ) as `${typeof PKG_V1}::bank::BurnBTokenEvent`, typeArgs: [ ] as [], isPhantom: BurnBTokenEvent.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => BurnBTokenEvent.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => BurnBTokenEvent.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => BurnBTokenEvent.fromBcs( data, ), bcs: BurnBTokenEvent.bcs, fromJSONField: (field: any) => BurnBTokenEvent.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => BurnBTokenEvent.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => BurnBTokenEvent.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => BurnBTokenEvent.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => BurnBTokenEvent.fetch( client, id, ), new: ( fields: BurnBTokenEventFields, ) => { return new BurnBTokenEvent( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return BurnBTokenEvent.reified() }

 static phantom( ): PhantomReified<ToTypeStr<BurnBTokenEvent>> { return phantom(BurnBTokenEvent.reified( )); } static get p() { return BurnBTokenEvent.phantom() }

 static get bcs() { return bcs.struct("BurnBTokenEvent", {

 user: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), bank_id: ID.bcs, lending_market_id: ID.bcs, withdrawn_amount: bcs.u64(), burned_amount: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): BurnBTokenEvent { return BurnBTokenEvent.reified( ).new( { user: decodeFromFields("address", fields.user), bankId: decodeFromFields(ID.reified(), fields.bank_id), lendingMarketId: decodeFromFields(ID.reified(), fields.lending_market_id), withdrawnAmount: decodeFromFields("u64", fields.withdrawn_amount), burnedAmount: decodeFromFields("u64", fields.burned_amount) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): BurnBTokenEvent { if (!isBurnBTokenEvent(item.type)) { throw new Error("not a BurnBTokenEvent type");

 }

 return BurnBTokenEvent.reified( ).new( { user: decodeFromFieldsWithTypes("address", item.fields.user), bankId: decodeFromFieldsWithTypes(ID.reified(), item.fields.bank_id), lendingMarketId: decodeFromFieldsWithTypes(ID.reified(), item.fields.lending_market_id), withdrawnAmount: decodeFromFieldsWithTypes("u64", item.fields.withdrawn_amount), burnedAmount: decodeFromFieldsWithTypes("u64", item.fields.burned_amount) } ) }

 static fromBcs( data: Uint8Array ): BurnBTokenEvent { return BurnBTokenEvent.fromFields( BurnBTokenEvent.bcs.parse(data) ) }

 toJSONField() { return {

 user: this.user,bankId: this.bankId,lendingMarketId: this.lendingMarketId,withdrawnAmount: this.withdrawnAmount.toString(),burnedAmount: this.burnedAmount.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): BurnBTokenEvent { return BurnBTokenEvent.reified( ).new( { user: decodeFromJSONField("address", field.user), bankId: decodeFromJSONField(ID.reified(), field.bankId), lendingMarketId: decodeFromJSONField(ID.reified(), field.lendingMarketId), withdrawnAmount: decodeFromJSONField("u64", field.withdrawnAmount), burnedAmount: decodeFromJSONField("u64", field.burnedAmount) } ) }

 static fromJSON( json: Record<string, any> ): BurnBTokenEvent { if (json.$typeName !== BurnBTokenEvent.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return BurnBTokenEvent.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): BurnBTokenEvent { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isBurnBTokenEvent(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a BurnBTokenEvent object`); } return BurnBTokenEvent.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): BurnBTokenEvent { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isBurnBTokenEvent(data.bcs.type)) { throw new Error(`object at is not a BurnBTokenEvent object`); }

 return BurnBTokenEvent.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return BurnBTokenEvent.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<BurnBTokenEvent> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching BurnBTokenEvent object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isBurnBTokenEvent(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a BurnBTokenEvent object`); }

 return BurnBTokenEvent.fromSuiObjectData( res.data ); }

 }

/* ============================== DeployEvent =============================== */

export function isDeployEvent(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::bank::DeployEvent`; }

export interface DeployEventFields { bankId: ToField<ID>; lendingMarketId: ToField<ID>; deployedAmount: ToField<"u64">; ctokensMinted: ToField<"u64"> }

export type DeployEventReified = Reified< DeployEvent, DeployEventFields >;

export class DeployEvent implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::DeployEvent`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = DeployEvent.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::DeployEvent`; readonly $typeArgs: []; readonly $isPhantom = DeployEvent.$isPhantom;

 readonly bankId: ToField<ID>; readonly lendingMarketId: ToField<ID>; readonly deployedAmount: ToField<"u64">; readonly ctokensMinted: ToField<"u64">

 private constructor(typeArgs: [], fields: DeployEventFields, ) { this.$fullTypeName = composeSuiType( DeployEvent.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::DeployEvent`; this.$typeArgs = typeArgs;

 this.bankId = fields.bankId;; this.lendingMarketId = fields.lendingMarketId;; this.deployedAmount = fields.deployedAmount;; this.ctokensMinted = fields.ctokensMinted; }

 static reified( ): DeployEventReified { return { typeName: DeployEvent.$typeName, fullTypeName: composeSuiType( DeployEvent.$typeName, ...[] ) as `${typeof PKG_V1}::bank::DeployEvent`, typeArgs: [ ] as [], isPhantom: DeployEvent.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => DeployEvent.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => DeployEvent.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => DeployEvent.fromBcs( data, ), bcs: DeployEvent.bcs, fromJSONField: (field: any) => DeployEvent.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => DeployEvent.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => DeployEvent.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => DeployEvent.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => DeployEvent.fetch( client, id, ), new: ( fields: DeployEventFields, ) => { return new DeployEvent( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return DeployEvent.reified() }

 static phantom( ): PhantomReified<ToTypeStr<DeployEvent>> { return phantom(DeployEvent.reified( )); } static get p() { return DeployEvent.phantom() }

 static get bcs() { return bcs.struct("DeployEvent", {

 bank_id: ID.bcs, lending_market_id: ID.bcs, deployed_amount: bcs.u64(), ctokens_minted: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): DeployEvent { return DeployEvent.reified( ).new( { bankId: decodeFromFields(ID.reified(), fields.bank_id), lendingMarketId: decodeFromFields(ID.reified(), fields.lending_market_id), deployedAmount: decodeFromFields("u64", fields.deployed_amount), ctokensMinted: decodeFromFields("u64", fields.ctokens_minted) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): DeployEvent { if (!isDeployEvent(item.type)) { throw new Error("not a DeployEvent type");

 }

 return DeployEvent.reified( ).new( { bankId: decodeFromFieldsWithTypes(ID.reified(), item.fields.bank_id), lendingMarketId: decodeFromFieldsWithTypes(ID.reified(), item.fields.lending_market_id), deployedAmount: decodeFromFieldsWithTypes("u64", item.fields.deployed_amount), ctokensMinted: decodeFromFieldsWithTypes("u64", item.fields.ctokens_minted) } ) }

 static fromBcs( data: Uint8Array ): DeployEvent { return DeployEvent.fromFields( DeployEvent.bcs.parse(data) ) }

 toJSONField() { return {

 bankId: this.bankId,lendingMarketId: this.lendingMarketId,deployedAmount: this.deployedAmount.toString(),ctokensMinted: this.ctokensMinted.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): DeployEvent { return DeployEvent.reified( ).new( { bankId: decodeFromJSONField(ID.reified(), field.bankId), lendingMarketId: decodeFromJSONField(ID.reified(), field.lendingMarketId), deployedAmount: decodeFromJSONField("u64", field.deployedAmount), ctokensMinted: decodeFromJSONField("u64", field.ctokensMinted) } ) }

 static fromJSON( json: Record<string, any> ): DeployEvent { if (json.$typeName !== DeployEvent.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return DeployEvent.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): DeployEvent { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isDeployEvent(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a DeployEvent object`); } return DeployEvent.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): DeployEvent { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isDeployEvent(data.bcs.type)) { throw new Error(`object at is not a DeployEvent object`); }

 return DeployEvent.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return DeployEvent.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<DeployEvent> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching DeployEvent object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isDeployEvent(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a DeployEvent object`); }

 return DeployEvent.fromSuiObjectData( res.data ); }

 }

/* ============================== Lending =============================== */

export function isLending(type: string): boolean { type = compressSuiType(type); return type.startsWith(`${PKG_V1}::bank::Lending` + '<'); }

export interface LendingFields<P extends PhantomTypeArgument> { ctokens: ToField<"u64">; targetUtilisationBps: ToField<"u16">; utilisationBufferBps: ToField<"u16">; reserveArrayIndex: ToField<"u64">; obligationCap: ToField<ObligationOwnerCap<P>> }

export type LendingReified<P extends PhantomTypeArgument> = Reified< Lending<P>, LendingFields<P> >;

export class Lending<P extends PhantomTypeArgument> implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::Lending`; static readonly $numTypeParams = 1; static readonly $isPhantom = [true,] as const;

 readonly $typeName = Lending.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::Lending<${PhantomToTypeStr<P>}>`; readonly $typeArgs: [PhantomToTypeStr<P>]; readonly $isPhantom = Lending.$isPhantom;

 readonly ctokens: ToField<"u64">; readonly targetUtilisationBps: ToField<"u16">; readonly utilisationBufferBps: ToField<"u16">; readonly reserveArrayIndex: ToField<"u64">; readonly obligationCap: ToField<ObligationOwnerCap<P>>

 private constructor(typeArgs: [PhantomToTypeStr<P>], fields: LendingFields<P>, ) { this.$fullTypeName = composeSuiType( Lending.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::Lending<${PhantomToTypeStr<P>}>`; this.$typeArgs = typeArgs;

 this.ctokens = fields.ctokens;; this.targetUtilisationBps = fields.targetUtilisationBps;; this.utilisationBufferBps = fields.utilisationBufferBps;; this.reserveArrayIndex = fields.reserveArrayIndex;; this.obligationCap = fields.obligationCap; }

 static reified<P extends PhantomReified<PhantomTypeArgument>>( P: P ): LendingReified<ToPhantomTypeArgument<P>> { return { typeName: Lending.$typeName, fullTypeName: composeSuiType( Lending.$typeName, ...[extractType(P)] ) as `${typeof PKG_V1}::bank::Lending<${PhantomToTypeStr<ToPhantomTypeArgument<P>>}>`, typeArgs: [ extractType(P) ] as [PhantomToTypeStr<ToPhantomTypeArgument<P>>], isPhantom: Lending.$isPhantom, reifiedTypeArgs: [P], fromFields: (fields: Record<string, any>) => Lending.fromFields( P, fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => Lending.fromFieldsWithTypes( P, item, ), fromBcs: (data: Uint8Array) => Lending.fromBcs( P, data, ), bcs: Lending.bcs, fromJSONField: (field: any) => Lending.fromJSONField( P, field, ), fromJSON: (json: Record<string, any>) => Lending.fromJSON( P, json, ), fromSuiParsedData: (content: SuiParsedData) => Lending.fromSuiParsedData( P, content, ), fromSuiObjectData: (content: SuiObjectData) => Lending.fromSuiObjectData( P, content, ), fetch: async (client: SuiClient, id: string) => Lending.fetch( client, P, id, ), new: ( fields: LendingFields<ToPhantomTypeArgument<P>>, ) => { return new Lending( [extractType(P)], fields ) }, kind: "StructClassReified", } }

 static get r() { return Lending.reified }

 static phantom<P extends PhantomReified<PhantomTypeArgument>>( P: P ): PhantomReified<ToTypeStr<Lending<ToPhantomTypeArgument<P>>>> { return phantom(Lending.reified( P )); } static get p() { return Lending.phantom }

 static get bcs() { return bcs.struct("Lending", {

 ctokens: bcs.u64(), target_utilisation_bps: bcs.u16(), utilisation_buffer_bps: bcs.u16(), reserve_array_index: bcs.u64(), obligation_cap: ObligationOwnerCap.bcs

}) };

 static fromFields<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, fields: Record<string, any> ): Lending<ToPhantomTypeArgument<P>> { return Lending.reified( typeArg, ).new( { ctokens: decodeFromFields("u64", fields.ctokens), targetUtilisationBps: decodeFromFields("u16", fields.target_utilisation_bps), utilisationBufferBps: decodeFromFields("u16", fields.utilisation_buffer_bps), reserveArrayIndex: decodeFromFields("u64", fields.reserve_array_index), obligationCap: decodeFromFields(ObligationOwnerCap.reified(typeArg), fields.obligation_cap) } ) }

 static fromFieldsWithTypes<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, item: FieldsWithTypes ): Lending<ToPhantomTypeArgument<P>> { if (!isLending(item.type)) { throw new Error("not a Lending type");

 } assertFieldsWithTypesArgsMatch(item, [typeArg]);

 return Lending.reified( typeArg, ).new( { ctokens: decodeFromFieldsWithTypes("u64", item.fields.ctokens), targetUtilisationBps: decodeFromFieldsWithTypes("u16", item.fields.target_utilisation_bps), utilisationBufferBps: decodeFromFieldsWithTypes("u16", item.fields.utilisation_buffer_bps), reserveArrayIndex: decodeFromFieldsWithTypes("u64", item.fields.reserve_array_index), obligationCap: decodeFromFieldsWithTypes(ObligationOwnerCap.reified(typeArg), item.fields.obligation_cap) } ) }

 static fromBcs<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, data: Uint8Array ): Lending<ToPhantomTypeArgument<P>> { return Lending.fromFields( typeArg, Lending.bcs.parse(data) ) }

 toJSONField() { return {

 ctokens: this.ctokens.toString(),targetUtilisationBps: this.targetUtilisationBps,utilisationBufferBps: this.utilisationBufferBps,reserveArrayIndex: this.reserveArrayIndex.toString(),obligationCap: this.obligationCap.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, field: any ): Lending<ToPhantomTypeArgument<P>> { return Lending.reified( typeArg, ).new( { ctokens: decodeFromJSONField("u64", field.ctokens), targetUtilisationBps: decodeFromJSONField("u16", field.targetUtilisationBps), utilisationBufferBps: decodeFromJSONField("u16", field.utilisationBufferBps), reserveArrayIndex: decodeFromJSONField("u64", field.reserveArrayIndex), obligationCap: decodeFromJSONField(ObligationOwnerCap.reified(typeArg), field.obligationCap) } ) }

 static fromJSON<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, json: Record<string, any> ): Lending<ToPhantomTypeArgument<P>> { if (json.$typeName !== Lending.$typeName) { throw new Error("not a WithTwoGenerics json object") }; assertReifiedTypeArgsMatch( composeSuiType(Lending.$typeName, extractType(typeArg)), json.$typeArgs, [typeArg], )

 return Lending.fromJSONField( typeArg, json, ) }

 static fromSuiParsedData<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, content: SuiParsedData ): Lending<ToPhantomTypeArgument<P>> { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isLending(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a Lending object`); } return Lending.fromFieldsWithTypes( typeArg, content ); }

 static fromSuiObjectData<P extends PhantomReified<PhantomTypeArgument>>( typeArg: P, data: SuiObjectData ): Lending<ToPhantomTypeArgument<P>> { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isLending(data.bcs.type)) { throw new Error(`object at is not a Lending object`); }

 const gotTypeArgs = parseTypeName(data.bcs.type).typeArgs; if (gotTypeArgs.length !== 1) { throw new Error(`type argument mismatch: expected 1 type argument but got '${gotTypeArgs.length}'`); }; const gotTypeArg = compressSuiType(gotTypeArgs[0]); const expectedTypeArg = compressSuiType(extractType(typeArg)); if (gotTypeArg !== compressSuiType(extractType(typeArg))) { throw new Error(`type argument mismatch: expected '${expectedTypeArg}' but got '${gotTypeArg}'`); };

 return Lending.fromBcs( typeArg, fromB64(data.bcs.bcsBytes) ); } if (data.content) { return Lending.fromSuiParsedData( typeArg, data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch<P extends PhantomReified<PhantomTypeArgument>>( client: SuiClient, typeArg: P, id: string ): Promise<Lending<ToPhantomTypeArgument<P>>> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching Lending object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isLending(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a Lending object`); }

 return Lending.fromSuiObjectData( typeArg, res.data ); }

 }

/* ============================== MintBTokenEvent =============================== */

export function isMintBTokenEvent(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::bank::MintBTokenEvent`; }

export interface MintBTokenEventFields { user: ToField<"address">; bankId: ToField<ID>; lendingMarketId: ToField<ID>; depositedAmount: ToField<"u64">; mintedAmount: ToField<"u64"> }

export type MintBTokenEventReified = Reified< MintBTokenEvent, MintBTokenEventFields >;

export class MintBTokenEvent implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::MintBTokenEvent`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = MintBTokenEvent.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::MintBTokenEvent`; readonly $typeArgs: []; readonly $isPhantom = MintBTokenEvent.$isPhantom;

 readonly user: ToField<"address">; readonly bankId: ToField<ID>; readonly lendingMarketId: ToField<ID>; readonly depositedAmount: ToField<"u64">; readonly mintedAmount: ToField<"u64">

 private constructor(typeArgs: [], fields: MintBTokenEventFields, ) { this.$fullTypeName = composeSuiType( MintBTokenEvent.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::MintBTokenEvent`; this.$typeArgs = typeArgs;

 this.user = fields.user;; this.bankId = fields.bankId;; this.lendingMarketId = fields.lendingMarketId;; this.depositedAmount = fields.depositedAmount;; this.mintedAmount = fields.mintedAmount; }

 static reified( ): MintBTokenEventReified { return { typeName: MintBTokenEvent.$typeName, fullTypeName: composeSuiType( MintBTokenEvent.$typeName, ...[] ) as `${typeof PKG_V1}::bank::MintBTokenEvent`, typeArgs: [ ] as [], isPhantom: MintBTokenEvent.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => MintBTokenEvent.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => MintBTokenEvent.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => MintBTokenEvent.fromBcs( data, ), bcs: MintBTokenEvent.bcs, fromJSONField: (field: any) => MintBTokenEvent.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => MintBTokenEvent.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => MintBTokenEvent.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => MintBTokenEvent.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => MintBTokenEvent.fetch( client, id, ), new: ( fields: MintBTokenEventFields, ) => { return new MintBTokenEvent( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return MintBTokenEvent.reified() }

 static phantom( ): PhantomReified<ToTypeStr<MintBTokenEvent>> { return phantom(MintBTokenEvent.reified( )); } static get p() { return MintBTokenEvent.phantom() }

 static get bcs() { return bcs.struct("MintBTokenEvent", {

 user: bcs.bytes(32).transform({ input: (val: string) => fromHEX(val), output: (val: Uint8Array) => toHEX(val), }), bank_id: ID.bcs, lending_market_id: ID.bcs, deposited_amount: bcs.u64(), minted_amount: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): MintBTokenEvent { return MintBTokenEvent.reified( ).new( { user: decodeFromFields("address", fields.user), bankId: decodeFromFields(ID.reified(), fields.bank_id), lendingMarketId: decodeFromFields(ID.reified(), fields.lending_market_id), depositedAmount: decodeFromFields("u64", fields.deposited_amount), mintedAmount: decodeFromFields("u64", fields.minted_amount) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): MintBTokenEvent { if (!isMintBTokenEvent(item.type)) { throw new Error("not a MintBTokenEvent type");

 }

 return MintBTokenEvent.reified( ).new( { user: decodeFromFieldsWithTypes("address", item.fields.user), bankId: decodeFromFieldsWithTypes(ID.reified(), item.fields.bank_id), lendingMarketId: decodeFromFieldsWithTypes(ID.reified(), item.fields.lending_market_id), depositedAmount: decodeFromFieldsWithTypes("u64", item.fields.deposited_amount), mintedAmount: decodeFromFieldsWithTypes("u64", item.fields.minted_amount) } ) }

 static fromBcs( data: Uint8Array ): MintBTokenEvent { return MintBTokenEvent.fromFields( MintBTokenEvent.bcs.parse(data) ) }

 toJSONField() { return {

 user: this.user,bankId: this.bankId,lendingMarketId: this.lendingMarketId,depositedAmount: this.depositedAmount.toString(),mintedAmount: this.mintedAmount.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): MintBTokenEvent { return MintBTokenEvent.reified( ).new( { user: decodeFromJSONField("address", field.user), bankId: decodeFromJSONField(ID.reified(), field.bankId), lendingMarketId: decodeFromJSONField(ID.reified(), field.lendingMarketId), depositedAmount: decodeFromJSONField("u64", field.depositedAmount), mintedAmount: decodeFromJSONField("u64", field.mintedAmount) } ) }

 static fromJSON( json: Record<string, any> ): MintBTokenEvent { if (json.$typeName !== MintBTokenEvent.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return MintBTokenEvent.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): MintBTokenEvent { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isMintBTokenEvent(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a MintBTokenEvent object`); } return MintBTokenEvent.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): MintBTokenEvent { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isMintBTokenEvent(data.bcs.type)) { throw new Error(`object at is not a MintBTokenEvent object`); }

 return MintBTokenEvent.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return MintBTokenEvent.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<MintBTokenEvent> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching MintBTokenEvent object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isMintBTokenEvent(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a MintBTokenEvent object`); }

 return MintBTokenEvent.fromSuiObjectData( res.data ); }

 }

/* ============================== NeedsRebalance =============================== */

export function isNeedsRebalance(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::bank::NeedsRebalance`; }

export interface NeedsRebalanceFields { needsRebalance: ToField<"bool"> }

export type NeedsRebalanceReified = Reified< NeedsRebalance, NeedsRebalanceFields >;

export class NeedsRebalance implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::NeedsRebalance`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = NeedsRebalance.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::NeedsRebalance`; readonly $typeArgs: []; readonly $isPhantom = NeedsRebalance.$isPhantom;

 readonly needsRebalance: ToField<"bool">

 private constructor(typeArgs: [], fields: NeedsRebalanceFields, ) { this.$fullTypeName = composeSuiType( NeedsRebalance.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::NeedsRebalance`; this.$typeArgs = typeArgs;

 this.needsRebalance = fields.needsRebalance; }

 static reified( ): NeedsRebalanceReified { return { typeName: NeedsRebalance.$typeName, fullTypeName: composeSuiType( NeedsRebalance.$typeName, ...[] ) as `${typeof PKG_V1}::bank::NeedsRebalance`, typeArgs: [ ] as [], isPhantom: NeedsRebalance.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => NeedsRebalance.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => NeedsRebalance.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => NeedsRebalance.fromBcs( data, ), bcs: NeedsRebalance.bcs, fromJSONField: (field: any) => NeedsRebalance.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => NeedsRebalance.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => NeedsRebalance.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => NeedsRebalance.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => NeedsRebalance.fetch( client, id, ), new: ( fields: NeedsRebalanceFields, ) => { return new NeedsRebalance( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return NeedsRebalance.reified() }

 static phantom( ): PhantomReified<ToTypeStr<NeedsRebalance>> { return phantom(NeedsRebalance.reified( )); } static get p() { return NeedsRebalance.phantom() }

 static get bcs() { return bcs.struct("NeedsRebalance", {

 needs_rebalance: bcs.bool()

}) };

 static fromFields( fields: Record<string, any> ): NeedsRebalance { return NeedsRebalance.reified( ).new( { needsRebalance: decodeFromFields("bool", fields.needs_rebalance) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): NeedsRebalance { if (!isNeedsRebalance(item.type)) { throw new Error("not a NeedsRebalance type");

 }

 return NeedsRebalance.reified( ).new( { needsRebalance: decodeFromFieldsWithTypes("bool", item.fields.needs_rebalance) } ) }

 static fromBcs( data: Uint8Array ): NeedsRebalance { return NeedsRebalance.fromFields( NeedsRebalance.bcs.parse(data) ) }

 toJSONField() { return {

 needsRebalance: this.needsRebalance,

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): NeedsRebalance { return NeedsRebalance.reified( ).new( { needsRebalance: decodeFromJSONField("bool", field.needsRebalance) } ) }

 static fromJSON( json: Record<string, any> ): NeedsRebalance { if (json.$typeName !== NeedsRebalance.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return NeedsRebalance.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): NeedsRebalance { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isNeedsRebalance(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a NeedsRebalance object`); } return NeedsRebalance.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): NeedsRebalance { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isNeedsRebalance(data.bcs.type)) { throw new Error(`object at is not a NeedsRebalance object`); }

 return NeedsRebalance.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return NeedsRebalance.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<NeedsRebalance> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching NeedsRebalance object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isNeedsRebalance(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a NeedsRebalance object`); }

 return NeedsRebalance.fromSuiObjectData( res.data ); }

 }

/* ============================== NewBankEvent =============================== */

export function isNewBankEvent(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::bank::NewBankEvent`; }

export interface NewBankEventFields { bankId: ToField<ID>; coinType: ToField<TypeName>; btokenType: ToField<TypeName>; lendingMarketId: ToField<ID>; lendingMarketType: ToField<TypeName> }

export type NewBankEventReified = Reified< NewBankEvent, NewBankEventFields >;

export class NewBankEvent implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::NewBankEvent`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = NewBankEvent.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::NewBankEvent`; readonly $typeArgs: []; readonly $isPhantom = NewBankEvent.$isPhantom;

 readonly bankId: ToField<ID>; readonly coinType: ToField<TypeName>; readonly btokenType: ToField<TypeName>; readonly lendingMarketId: ToField<ID>; readonly lendingMarketType: ToField<TypeName>

 private constructor(typeArgs: [], fields: NewBankEventFields, ) { this.$fullTypeName = composeSuiType( NewBankEvent.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::NewBankEvent`; this.$typeArgs = typeArgs;

 this.bankId = fields.bankId;; this.coinType = fields.coinType;; this.btokenType = fields.btokenType;; this.lendingMarketId = fields.lendingMarketId;; this.lendingMarketType = fields.lendingMarketType; }

 static reified( ): NewBankEventReified { return { typeName: NewBankEvent.$typeName, fullTypeName: composeSuiType( NewBankEvent.$typeName, ...[] ) as `${typeof PKG_V1}::bank::NewBankEvent`, typeArgs: [ ] as [], isPhantom: NewBankEvent.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => NewBankEvent.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => NewBankEvent.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => NewBankEvent.fromBcs( data, ), bcs: NewBankEvent.bcs, fromJSONField: (field: any) => NewBankEvent.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => NewBankEvent.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => NewBankEvent.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => NewBankEvent.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => NewBankEvent.fetch( client, id, ), new: ( fields: NewBankEventFields, ) => { return new NewBankEvent( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return NewBankEvent.reified() }

 static phantom( ): PhantomReified<ToTypeStr<NewBankEvent>> { return phantom(NewBankEvent.reified( )); } static get p() { return NewBankEvent.phantom() }

 static get bcs() { return bcs.struct("NewBankEvent", {

 bank_id: ID.bcs, coin_type: TypeName.bcs, btoken_type: TypeName.bcs, lending_market_id: ID.bcs, lending_market_type: TypeName.bcs

}) };

 static fromFields( fields: Record<string, any> ): NewBankEvent { return NewBankEvent.reified( ).new( { bankId: decodeFromFields(ID.reified(), fields.bank_id), coinType: decodeFromFields(TypeName.reified(), fields.coin_type), btokenType: decodeFromFields(TypeName.reified(), fields.btoken_type), lendingMarketId: decodeFromFields(ID.reified(), fields.lending_market_id), lendingMarketType: decodeFromFields(TypeName.reified(), fields.lending_market_type) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): NewBankEvent { if (!isNewBankEvent(item.type)) { throw new Error("not a NewBankEvent type");

 }

 return NewBankEvent.reified( ).new( { bankId: decodeFromFieldsWithTypes(ID.reified(), item.fields.bank_id), coinType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.coin_type), btokenType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.btoken_type), lendingMarketId: decodeFromFieldsWithTypes(ID.reified(), item.fields.lending_market_id), lendingMarketType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.lending_market_type) } ) }

 static fromBcs( data: Uint8Array ): NewBankEvent { return NewBankEvent.fromFields( NewBankEvent.bcs.parse(data) ) }

 toJSONField() { return {

 bankId: this.bankId,coinType: this.coinType.toJSONField(),btokenType: this.btokenType.toJSONField(),lendingMarketId: this.lendingMarketId,lendingMarketType: this.lendingMarketType.toJSONField(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): NewBankEvent { return NewBankEvent.reified( ).new( { bankId: decodeFromJSONField(ID.reified(), field.bankId), coinType: decodeFromJSONField(TypeName.reified(), field.coinType), btokenType: decodeFromJSONField(TypeName.reified(), field.btokenType), lendingMarketId: decodeFromJSONField(ID.reified(), field.lendingMarketId), lendingMarketType: decodeFromJSONField(TypeName.reified(), field.lendingMarketType) } ) }

 static fromJSON( json: Record<string, any> ): NewBankEvent { if (json.$typeName !== NewBankEvent.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return NewBankEvent.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): NewBankEvent { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isNewBankEvent(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a NewBankEvent object`); } return NewBankEvent.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): NewBankEvent { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isNewBankEvent(data.bcs.type)) { throw new Error(`object at is not a NewBankEvent object`); }

 return NewBankEvent.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return NewBankEvent.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<NewBankEvent> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching NewBankEvent object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isNewBankEvent(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a NewBankEvent object`); }

 return NewBankEvent.fromSuiObjectData( res.data ); }

 }

/* ============================== RecallEvent =============================== */

export function isRecallEvent(type: string): boolean { type = compressSuiType(type); return type === `${PKG_V1}::bank::RecallEvent`; }

export interface RecallEventFields { bankId: ToField<ID>; lendingMarketId: ToField<ID>; recalledAmount: ToField<"u64">; ctokensBurned: ToField<"u64"> }

export type RecallEventReified = Reified< RecallEvent, RecallEventFields >;

export class RecallEvent implements StructClass { __StructClass = true as const;

 static readonly $typeName = `${PKG_V1}::bank::RecallEvent`; static readonly $numTypeParams = 0; static readonly $isPhantom = [] as const;

 readonly $typeName = RecallEvent.$typeName; readonly $fullTypeName: `${typeof PKG_V1}::bank::RecallEvent`; readonly $typeArgs: []; readonly $isPhantom = RecallEvent.$isPhantom;

 readonly bankId: ToField<ID>; readonly lendingMarketId: ToField<ID>; readonly recalledAmount: ToField<"u64">; readonly ctokensBurned: ToField<"u64">

 private constructor(typeArgs: [], fields: RecallEventFields, ) { this.$fullTypeName = composeSuiType( RecallEvent.$typeName, ...typeArgs ) as `${typeof PKG_V1}::bank::RecallEvent`; this.$typeArgs = typeArgs;

 this.bankId = fields.bankId;; this.lendingMarketId = fields.lendingMarketId;; this.recalledAmount = fields.recalledAmount;; this.ctokensBurned = fields.ctokensBurned; }

 static reified( ): RecallEventReified { return { typeName: RecallEvent.$typeName, fullTypeName: composeSuiType( RecallEvent.$typeName, ...[] ) as `${typeof PKG_V1}::bank::RecallEvent`, typeArgs: [ ] as [], isPhantom: RecallEvent.$isPhantom, reifiedTypeArgs: [], fromFields: (fields: Record<string, any>) => RecallEvent.fromFields( fields, ), fromFieldsWithTypes: (item: FieldsWithTypes) => RecallEvent.fromFieldsWithTypes( item, ), fromBcs: (data: Uint8Array) => RecallEvent.fromBcs( data, ), bcs: RecallEvent.bcs, fromJSONField: (field: any) => RecallEvent.fromJSONField( field, ), fromJSON: (json: Record<string, any>) => RecallEvent.fromJSON( json, ), fromSuiParsedData: (content: SuiParsedData) => RecallEvent.fromSuiParsedData( content, ), fromSuiObjectData: (content: SuiObjectData) => RecallEvent.fromSuiObjectData( content, ), fetch: async (client: SuiClient, id: string) => RecallEvent.fetch( client, id, ), new: ( fields: RecallEventFields, ) => { return new RecallEvent( [], fields ) }, kind: "StructClassReified", } }

 static get r() { return RecallEvent.reified() }

 static phantom( ): PhantomReified<ToTypeStr<RecallEvent>> { return phantom(RecallEvent.reified( )); } static get p() { return RecallEvent.phantom() }

 static get bcs() { return bcs.struct("RecallEvent", {

 bank_id: ID.bcs, lending_market_id: ID.bcs, recalled_amount: bcs.u64(), ctokens_burned: bcs.u64()

}) };

 static fromFields( fields: Record<string, any> ): RecallEvent { return RecallEvent.reified( ).new( { bankId: decodeFromFields(ID.reified(), fields.bank_id), lendingMarketId: decodeFromFields(ID.reified(), fields.lending_market_id), recalledAmount: decodeFromFields("u64", fields.recalled_amount), ctokensBurned: decodeFromFields("u64", fields.ctokens_burned) } ) }

 static fromFieldsWithTypes( item: FieldsWithTypes ): RecallEvent { if (!isRecallEvent(item.type)) { throw new Error("not a RecallEvent type");

 }

 return RecallEvent.reified( ).new( { bankId: decodeFromFieldsWithTypes(ID.reified(), item.fields.bank_id), lendingMarketId: decodeFromFieldsWithTypes(ID.reified(), item.fields.lending_market_id), recalledAmount: decodeFromFieldsWithTypes("u64", item.fields.recalled_amount), ctokensBurned: decodeFromFieldsWithTypes("u64", item.fields.ctokens_burned) } ) }

 static fromBcs( data: Uint8Array ): RecallEvent { return RecallEvent.fromFields( RecallEvent.bcs.parse(data) ) }

 toJSONField() { return {

 bankId: this.bankId,lendingMarketId: this.lendingMarketId,recalledAmount: this.recalledAmount.toString(),ctokensBurned: this.ctokensBurned.toString(),

} }

 toJSON() { return { $typeName: this.$typeName, $typeArgs: this.$typeArgs, ...this.toJSONField() } }

 static fromJSONField( field: any ): RecallEvent { return RecallEvent.reified( ).new( { bankId: decodeFromJSONField(ID.reified(), field.bankId), lendingMarketId: decodeFromJSONField(ID.reified(), field.lendingMarketId), recalledAmount: decodeFromJSONField("u64", field.recalledAmount), ctokensBurned: decodeFromJSONField("u64", field.ctokensBurned) } ) }

 static fromJSON( json: Record<string, any> ): RecallEvent { if (json.$typeName !== RecallEvent.$typeName) { throw new Error("not a WithTwoGenerics json object") };

 return RecallEvent.fromJSONField( json, ) }

 static fromSuiParsedData( content: SuiParsedData ): RecallEvent { if (content.dataType !== "moveObject") { throw new Error("not an object"); } if (!isRecallEvent(content.type)) { throw new Error(`object at ${(content.fields as any).id} is not a RecallEvent object`); } return RecallEvent.fromFieldsWithTypes( content ); }

 static fromSuiObjectData( data: SuiObjectData ): RecallEvent { if (data.bcs) { if (data.bcs.dataType !== "moveObject" || !isRecallEvent(data.bcs.type)) { throw new Error(`object at is not a RecallEvent object`); }

 return RecallEvent.fromBcs( fromB64(data.bcs.bcsBytes) ); } if (data.content) { return RecallEvent.fromSuiParsedData( data.content ) } throw new Error( "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request." ); }

 static async fetch( client: SuiClient, id: string ): Promise<RecallEvent> { const res = await client.getObject({ id, options: { showBcs: true, }, }); if (res.error) { throw new Error(`error fetching RecallEvent object at id ${id}: ${res.error.code}`); } if (res.data?.bcs?.dataType !== "moveObject" || !isRecallEvent(res.data.bcs.type)) { throw new Error(`object at id ${id} is not a RecallEvent object`); }

 return RecallEvent.fromSuiObjectData( res.data ); }

 }
