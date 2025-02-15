import {TypeName} from "../../_dependencies/source/0x1/type-name/structs";
import {Bag} from "../../_dependencies/source/0x2/bag/structs";
import {ID, UID} from "../../_dependencies/source/0x2/object/structs";
import {PhantomReified, Reified, StructClass, ToField, ToTypeStr, decodeFromFields, decodeFromFieldsWithTypes, decodeFromJSONField, phantom} from "../../_framework/reified";
import {FieldsWithTypes, composeSuiType, compressSuiType} from "../../_framework/util";
import {PKG_V1} from "../index";
import {Version} from "../version/structs";
import {bcs} from "@mysten/sui/bcs";
import {SuiClient, SuiObjectData, SuiParsedData} from "@mysten/sui/client";
import {fromB64} from "@mysten/sui/utils";

/* ============================== BankData =============================== */

export function isBankData(type: string): boolean {
    type = compressSuiType(type);
    return type === `${PKG_V1}::registry::BankData`;
}

export interface BankDataFields {
    bankId: ToField<ID>; btokenType: ToField<TypeName>; lendingMarketType: ToField<TypeName>
}

export type BankDataReified = Reified<
    BankData,
    BankDataFields
>;

export class BankData implements StructClass {
    __StructClass = true as const;

    static readonly $typeName = `${PKG_V1}::registry::BankData`;
    static readonly $numTypeParams = 0;
    static readonly $isPhantom = [] as const;

    readonly $typeName = BankData.$typeName;
    readonly $fullTypeName: `${typeof PKG_V1}::registry::BankData`;
    readonly $typeArgs: [];
    readonly $isPhantom = BankData.$isPhantom;

    readonly bankId:
        ToField<ID>
    ; readonly btokenType:
        ToField<TypeName>
    ; readonly lendingMarketType:
        ToField<TypeName>

    private constructor(typeArgs: [], fields: BankDataFields,
    ) {
        this.$fullTypeName = composeSuiType(
            BankData.$typeName,
            ...typeArgs
        ) as `${typeof PKG_V1}::registry::BankData`;
        this.$typeArgs = typeArgs;

        this.bankId = fields.bankId;; this.btokenType = fields.btokenType;; this.lendingMarketType = fields.lendingMarketType;
    }

    static reified(): BankDataReified {
        return {
            typeName: BankData.$typeName,
            fullTypeName: composeSuiType(
                BankData.$typeName,
                ...[]
            ) as `${typeof PKG_V1}::registry::BankData`,
            typeArgs: [] as [],
            isPhantom: BankData.$isPhantom,
            reifiedTypeArgs: [],
            fromFields: (fields: Record<string, any>) =>
                BankData.fromFields(
                    fields,
                ),
            fromFieldsWithTypes: (item: FieldsWithTypes) =>
                BankData.fromFieldsWithTypes(
                    item,
                ),
            fromBcs: (data: Uint8Array) =>
                BankData.fromBcs(
                    data,
                ),
            bcs: BankData.bcs,
            fromJSONField: (field: any) =>
                BankData.fromJSONField(
                    field,
                ),
            fromJSON: (json: Record<string, any>) =>
                BankData.fromJSON(
                    json,
                ),
            fromSuiParsedData: (content: SuiParsedData) =>
                BankData.fromSuiParsedData(
                    content,
                ),
            fromSuiObjectData: (content: SuiObjectData) =>
                BankData.fromSuiObjectData(
                    content,
                ),
            fetch: async (client: SuiClient, id: string) => BankData.fetch(
                client,
                id,
            ),
            new: (
                fields: BankDataFields,
            ) => {
                return new BankData(
                    [],
                    fields
                )
            },
            kind: "StructClassReified",
        }
    }

    static get r() {
        return BankData.reified()
    }

    static phantom(): PhantomReified<ToTypeStr<BankData>> {
        return phantom(BankData.reified());
    }

    static get p() {
        return BankData.phantom()
    }

    static get bcs() {
        return bcs.struct("BankData", {
            bank_id:
                ID.bcs
            , btoken_type:
                TypeName.bcs
            , lending_market_type:
                TypeName.bcs

        })
    };

    static fromFields(
         fields: Record<string, any>
    ): BankData {
        return BankData.reified().new(
            {bankId: decodeFromFields(ID.reified(), fields.bank_id), btokenType: decodeFromFields(TypeName.reified(), fields.btoken_type), lendingMarketType: decodeFromFields(TypeName.reified(), fields.lending_market_type)}
        )
    }

    static fromFieldsWithTypes(
         item: FieldsWithTypes
    ): BankData {
        if (!isBankData(item.type)) {
            throw new Error("not a BankData type");
        }

        return BankData.reified().new(
            {bankId: decodeFromFieldsWithTypes(ID.reified(), item.fields.bank_id), btokenType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.btoken_type), lendingMarketType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.lending_market_type)}
        )
    }

    static fromBcs(
         data: Uint8Array
    ): BankData {

        return BankData.fromFields(
            BankData.bcs.parse(data)
        )
    }

    toJSONField() {
        return {
            bankId: this.bankId,btokenType: this.btokenType.toJSONField(),lendingMarketType: this.lendingMarketType.toJSONField(),

        }
    }

    toJSON() {
        return {
            $typeName: this.$typeName,
            $typeArgs: this.$typeArgs,
            ...this.toJSONField()
        }
    }

    static fromJSONField(
         field: any
    ): BankData {
        return BankData.reified().new(
            {bankId: decodeFromJSONField(ID.reified(), field.bankId), btokenType: decodeFromJSONField(TypeName.reified(), field.btokenType), lendingMarketType: decodeFromJSONField(TypeName.reified(), field.lendingMarketType)}
        )
    }

    static fromJSON(
         json: Record<string, any>
    ): BankData {
        if (json.$typeName !== BankData.$typeName) {
            throw new Error("not a WithTwoGenerics json object")
        };

        return BankData.fromJSONField(
            json,
        )
    }

    static fromSuiParsedData(
         content: SuiParsedData
    ): BankData {
        if (content.dataType !== "moveObject") {
            throw new Error("not an object");
        }
        if (!isBankData(content.type)) {
            throw new Error(`object at ${(content.fields as any).id} is not a BankData object`);
        }
        return BankData.fromFieldsWithTypes(
            content
        );
    }

    static fromSuiObjectData(
         data: SuiObjectData
    ): BankData {
        if (data.bcs) {
            if (data.bcs.dataType !== "moveObject" || !isBankData(data.bcs.type)) {
                throw new Error(`object at is not a BankData object`);
            }

            return BankData.fromBcs(
                fromB64(data.bcs.bcsBytes)
            );
        }
        if (data.content) {
            return BankData.fromSuiParsedData(
                data.content
            )
        }

        throw new Error(
            "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request."
        );
    }

    static async fetch(
        client: SuiClient, id: string
    ): Promise<BankData> {
        const res = await client.getObject({
            id,
            options: {
                showBcs: true,
            },
        });
        if (res.error) {
            throw new Error(`error fetching BankData object at id ${id}: ${res.error.code}`);
        }
        if (res.data?.bcs?.dataType !== "moveObject" || !isBankData(res.data.bcs.type)) {
            throw new Error(`object at id ${id} is not a BankData object`);
        }

        return BankData.fromSuiObjectData(
            res.data
        );
    }
}

/* ============================== BankKey =============================== */

export function isBankKey(type: string): boolean {
    type = compressSuiType(type);
    return type === `${PKG_V1}::registry::BankKey`;
}

export interface BankKeyFields {
    lendingMarketId: ToField<ID>; coinType: ToField<TypeName>
}

export type BankKeyReified = Reified<
    BankKey,
    BankKeyFields
>;

export class BankKey implements StructClass {
    __StructClass = true as const;

    static readonly $typeName = `${PKG_V1}::registry::BankKey`;
    static readonly $numTypeParams = 0;
    static readonly $isPhantom = [] as const;

    readonly $typeName = BankKey.$typeName;
    readonly $fullTypeName: `${typeof PKG_V1}::registry::BankKey`;
    readonly $typeArgs: [];
    readonly $isPhantom = BankKey.$isPhantom;

    readonly lendingMarketId:
        ToField<ID>
    ; readonly coinType:
        ToField<TypeName>

    private constructor(typeArgs: [], fields: BankKeyFields,
    ) {
        this.$fullTypeName = composeSuiType(
            BankKey.$typeName,
            ...typeArgs
        ) as `${typeof PKG_V1}::registry::BankKey`;
        this.$typeArgs = typeArgs;

        this.lendingMarketId = fields.lendingMarketId;; this.coinType = fields.coinType;
    }

    static reified(): BankKeyReified {
        return {
            typeName: BankKey.$typeName,
            fullTypeName: composeSuiType(
                BankKey.$typeName,
                ...[]
            ) as `${typeof PKG_V1}::registry::BankKey`,
            typeArgs: [] as [],
            isPhantom: BankKey.$isPhantom,
            reifiedTypeArgs: [],
            fromFields: (fields: Record<string, any>) =>
                BankKey.fromFields(
                    fields,
                ),
            fromFieldsWithTypes: (item: FieldsWithTypes) =>
                BankKey.fromFieldsWithTypes(
                    item,
                ),
            fromBcs: (data: Uint8Array) =>
                BankKey.fromBcs(
                    data,
                ),
            bcs: BankKey.bcs,
            fromJSONField: (field: any) =>
                BankKey.fromJSONField(
                    field,
                ),
            fromJSON: (json: Record<string, any>) =>
                BankKey.fromJSON(
                    json,
                ),
            fromSuiParsedData: (content: SuiParsedData) =>
                BankKey.fromSuiParsedData(
                    content,
                ),
            fromSuiObjectData: (content: SuiObjectData) =>
                BankKey.fromSuiObjectData(
                    content,
                ),
            fetch: async (client: SuiClient, id: string) => BankKey.fetch(
                client,
                id,
            ),
            new: (
                fields: BankKeyFields,
            ) => {
                return new BankKey(
                    [],
                    fields
                )
            },
            kind: "StructClassReified",
        }
    }

    static get r() {
        return BankKey.reified()
    }

    static phantom(): PhantomReified<ToTypeStr<BankKey>> {
        return phantom(BankKey.reified());
    }

    static get p() {
        return BankKey.phantom()
    }

    static get bcs() {
        return bcs.struct("BankKey", {
            lending_market_id:
                ID.bcs
            , coin_type:
                TypeName.bcs

        })
    };

    static fromFields(
         fields: Record<string, any>
    ): BankKey {
        return BankKey.reified().new(
            {lendingMarketId: decodeFromFields(ID.reified(), fields.lending_market_id), coinType: decodeFromFields(TypeName.reified(), fields.coin_type)}
        )
    }

    static fromFieldsWithTypes(
         item: FieldsWithTypes
    ): BankKey {
        if (!isBankKey(item.type)) {
            throw new Error("not a BankKey type");
        }

        return BankKey.reified().new(
            {lendingMarketId: decodeFromFieldsWithTypes(ID.reified(), item.fields.lending_market_id), coinType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.coin_type)}
        )
    }

    static fromBcs(
         data: Uint8Array
    ): BankKey {

        return BankKey.fromFields(
            BankKey.bcs.parse(data)
        )
    }

    toJSONField() {
        return {
            lendingMarketId: this.lendingMarketId,coinType: this.coinType.toJSONField(),

        }
    }

    toJSON() {
        return {
            $typeName: this.$typeName,
            $typeArgs: this.$typeArgs,
            ...this.toJSONField()
        }
    }

    static fromJSONField(
         field: any
    ): BankKey {
        return BankKey.reified().new(
            {lendingMarketId: decodeFromJSONField(ID.reified(), field.lendingMarketId), coinType: decodeFromJSONField(TypeName.reified(), field.coinType)}
        )
    }

    static fromJSON(
         json: Record<string, any>
    ): BankKey {
        if (json.$typeName !== BankKey.$typeName) {
            throw new Error("not a WithTwoGenerics json object")
        };

        return BankKey.fromJSONField(
            json,
        )
    }

    static fromSuiParsedData(
         content: SuiParsedData
    ): BankKey {
        if (content.dataType !== "moveObject") {
            throw new Error("not an object");
        }
        if (!isBankKey(content.type)) {
            throw new Error(`object at ${(content.fields as any).id} is not a BankKey object`);
        }
        return BankKey.fromFieldsWithTypes(
            content
        );
    }

    static fromSuiObjectData(
         data: SuiObjectData
    ): BankKey {
        if (data.bcs) {
            if (data.bcs.dataType !== "moveObject" || !isBankKey(data.bcs.type)) {
                throw new Error(`object at is not a BankKey object`);
            }

            return BankKey.fromBcs(
                fromB64(data.bcs.bcsBytes)
            );
        }
        if (data.content) {
            return BankKey.fromSuiParsedData(
                data.content
            )
        }

        throw new Error(
            "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request."
        );
    }

    static async fetch(
        client: SuiClient, id: string
    ): Promise<BankKey> {
        const res = await client.getObject({
            id,
            options: {
                showBcs: true,
            },
        });
        if (res.error) {
            throw new Error(`error fetching BankKey object at id ${id}: ${res.error.code}`);
        }
        if (res.data?.bcs?.dataType !== "moveObject" || !isBankKey(res.data.bcs.type)) {
            throw new Error(`object at id ${id} is not a BankKey object`);
        }

        return BankKey.fromSuiObjectData(
            res.data
        );
    }
}

/* ============================== PoolData =============================== */

export function isPoolData(type: string): boolean {
    type = compressSuiType(type);
    return type === `${PKG_V1}::registry::PoolData`;
}

export interface PoolDataFields {
    poolId: ToField<ID>; quoterType: ToField<TypeName>; swapFeeBps: ToField<"u64">; lpTokenType: ToField<TypeName>
}

export type PoolDataReified = Reified<
    PoolData,
    PoolDataFields
>;

export class PoolData implements StructClass {
    __StructClass = true as const;

    static readonly $typeName = `${PKG_V1}::registry::PoolData`;
    static readonly $numTypeParams = 0;
    static readonly $isPhantom = [] as const;

    readonly $typeName = PoolData.$typeName;
    readonly $fullTypeName: `${typeof PKG_V1}::registry::PoolData`;
    readonly $typeArgs: [];
    readonly $isPhantom = PoolData.$isPhantom;

    readonly poolId:
        ToField<ID>
    ; readonly quoterType:
        ToField<TypeName>
    ; readonly swapFeeBps:
        ToField<"u64">
    ; readonly lpTokenType:
        ToField<TypeName>

    private constructor(typeArgs: [], fields: PoolDataFields,
    ) {
        this.$fullTypeName = composeSuiType(
            PoolData.$typeName,
            ...typeArgs
        ) as `${typeof PKG_V1}::registry::PoolData`;
        this.$typeArgs = typeArgs;

        this.poolId = fields.poolId;; this.quoterType = fields.quoterType;; this.swapFeeBps = fields.swapFeeBps;; this.lpTokenType = fields.lpTokenType;
    }

    static reified(): PoolDataReified {
        return {
            typeName: PoolData.$typeName,
            fullTypeName: composeSuiType(
                PoolData.$typeName,
                ...[]
            ) as `${typeof PKG_V1}::registry::PoolData`,
            typeArgs: [] as [],
            isPhantom: PoolData.$isPhantom,
            reifiedTypeArgs: [],
            fromFields: (fields: Record<string, any>) =>
                PoolData.fromFields(
                    fields,
                ),
            fromFieldsWithTypes: (item: FieldsWithTypes) =>
                PoolData.fromFieldsWithTypes(
                    item,
                ),
            fromBcs: (data: Uint8Array) =>
                PoolData.fromBcs(
                    data,
                ),
            bcs: PoolData.bcs,
            fromJSONField: (field: any) =>
                PoolData.fromJSONField(
                    field,
                ),
            fromJSON: (json: Record<string, any>) =>
                PoolData.fromJSON(
                    json,
                ),
            fromSuiParsedData: (content: SuiParsedData) =>
                PoolData.fromSuiParsedData(
                    content,
                ),
            fromSuiObjectData: (content: SuiObjectData) =>
                PoolData.fromSuiObjectData(
                    content,
                ),
            fetch: async (client: SuiClient, id: string) => PoolData.fetch(
                client,
                id,
            ),
            new: (
                fields: PoolDataFields,
            ) => {
                return new PoolData(
                    [],
                    fields
                )
            },
            kind: "StructClassReified",
        }
    }

    static get r() {
        return PoolData.reified()
    }

    static phantom(): PhantomReified<ToTypeStr<PoolData>> {
        return phantom(PoolData.reified());
    }

    static get p() {
        return PoolData.phantom()
    }

    static get bcs() {
        return bcs.struct("PoolData", {
            pool_id:
                ID.bcs
            , quoter_type:
                TypeName.bcs
            , swap_fee_bps:
                bcs.u64()
            , lp_token_type:
                TypeName.bcs

        })
    };

    static fromFields(
         fields: Record<string, any>
    ): PoolData {
        return PoolData.reified().new(
            {poolId: decodeFromFields(ID.reified(), fields.pool_id), quoterType: decodeFromFields(TypeName.reified(), fields.quoter_type), swapFeeBps: decodeFromFields("u64", fields.swap_fee_bps), lpTokenType: decodeFromFields(TypeName.reified(), fields.lp_token_type)}
        )
    }

    static fromFieldsWithTypes(
         item: FieldsWithTypes
    ): PoolData {
        if (!isPoolData(item.type)) {
            throw new Error("not a PoolData type");
        }

        return PoolData.reified().new(
            {poolId: decodeFromFieldsWithTypes(ID.reified(), item.fields.pool_id), quoterType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.quoter_type), swapFeeBps: decodeFromFieldsWithTypes("u64", item.fields.swap_fee_bps), lpTokenType: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.lp_token_type)}
        )
    }

    static fromBcs(
         data: Uint8Array
    ): PoolData {

        return PoolData.fromFields(
            PoolData.bcs.parse(data)
        )
    }

    toJSONField() {
        return {
            poolId: this.poolId,quoterType: this.quoterType.toJSONField(),swapFeeBps: this.swapFeeBps.toString(),lpTokenType: this.lpTokenType.toJSONField(),

        }
    }

    toJSON() {
        return {
            $typeName: this.$typeName,
            $typeArgs: this.$typeArgs,
            ...this.toJSONField()
        }
    }

    static fromJSONField(
         field: any
    ): PoolData {
        return PoolData.reified().new(
            {poolId: decodeFromJSONField(ID.reified(), field.poolId), quoterType: decodeFromJSONField(TypeName.reified(), field.quoterType), swapFeeBps: decodeFromJSONField("u64", field.swapFeeBps), lpTokenType: decodeFromJSONField(TypeName.reified(), field.lpTokenType)}
        )
    }

    static fromJSON(
         json: Record<string, any>
    ): PoolData {
        if (json.$typeName !== PoolData.$typeName) {
            throw new Error("not a WithTwoGenerics json object")
        };

        return PoolData.fromJSONField(
            json,
        )
    }

    static fromSuiParsedData(
         content: SuiParsedData
    ): PoolData {
        if (content.dataType !== "moveObject") {
            throw new Error("not an object");
        }
        if (!isPoolData(content.type)) {
            throw new Error(`object at ${(content.fields as any).id} is not a PoolData object`);
        }
        return PoolData.fromFieldsWithTypes(
            content
        );
    }

    static fromSuiObjectData(
         data: SuiObjectData
    ): PoolData {
        if (data.bcs) {
            if (data.bcs.dataType !== "moveObject" || !isPoolData(data.bcs.type)) {
                throw new Error(`object at is not a PoolData object`);
            }

            return PoolData.fromBcs(
                fromB64(data.bcs.bcsBytes)
            );
        }
        if (data.content) {
            return PoolData.fromSuiParsedData(
                data.content
            )
        }

        throw new Error(
            "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request."
        );
    }

    static async fetch(
        client: SuiClient, id: string
    ): Promise<PoolData> {
        const res = await client.getObject({
            id,
            options: {
                showBcs: true,
            },
        });
        if (res.error) {
            throw new Error(`error fetching PoolData object at id ${id}: ${res.error.code}`);
        }
        if (res.data?.bcs?.dataType !== "moveObject" || !isPoolData(res.data.bcs.type)) {
            throw new Error(`object at id ${id} is not a PoolData object`);
        }

        return PoolData.fromSuiObjectData(
            res.data
        );
    }
}

/* ============================== PoolKey =============================== */

export function isPoolKey(type: string): boolean {
    type = compressSuiType(type);
    return type === `${PKG_V1}::registry::PoolKey`;
}

export interface PoolKeyFields {
    coinTypeA: ToField<TypeName>; coinTypeB: ToField<TypeName>
}

export type PoolKeyReified = Reified<
    PoolKey,
    PoolKeyFields
>;

export class PoolKey implements StructClass {
    __StructClass = true as const;

    static readonly $typeName = `${PKG_V1}::registry::PoolKey`;
    static readonly $numTypeParams = 0;
    static readonly $isPhantom = [] as const;

    readonly $typeName = PoolKey.$typeName;
    readonly $fullTypeName: `${typeof PKG_V1}::registry::PoolKey`;
    readonly $typeArgs: [];
    readonly $isPhantom = PoolKey.$isPhantom;

    readonly coinTypeA:
        ToField<TypeName>
    ; readonly coinTypeB:
        ToField<TypeName>

    private constructor(typeArgs: [], fields: PoolKeyFields,
    ) {
        this.$fullTypeName = composeSuiType(
            PoolKey.$typeName,
            ...typeArgs
        ) as `${typeof PKG_V1}::registry::PoolKey`;
        this.$typeArgs = typeArgs;

        this.coinTypeA = fields.coinTypeA;; this.coinTypeB = fields.coinTypeB;
    }

    static reified(): PoolKeyReified {
        return {
            typeName: PoolKey.$typeName,
            fullTypeName: composeSuiType(
                PoolKey.$typeName,
                ...[]
            ) as `${typeof PKG_V1}::registry::PoolKey`,
            typeArgs: [] as [],
            isPhantom: PoolKey.$isPhantom,
            reifiedTypeArgs: [],
            fromFields: (fields: Record<string, any>) =>
                PoolKey.fromFields(
                    fields,
                ),
            fromFieldsWithTypes: (item: FieldsWithTypes) =>
                PoolKey.fromFieldsWithTypes(
                    item,
                ),
            fromBcs: (data: Uint8Array) =>
                PoolKey.fromBcs(
                    data,
                ),
            bcs: PoolKey.bcs,
            fromJSONField: (field: any) =>
                PoolKey.fromJSONField(
                    field,
                ),
            fromJSON: (json: Record<string, any>) =>
                PoolKey.fromJSON(
                    json,
                ),
            fromSuiParsedData: (content: SuiParsedData) =>
                PoolKey.fromSuiParsedData(
                    content,
                ),
            fromSuiObjectData: (content: SuiObjectData) =>
                PoolKey.fromSuiObjectData(
                    content,
                ),
            fetch: async (client: SuiClient, id: string) => PoolKey.fetch(
                client,
                id,
            ),
            new: (
                fields: PoolKeyFields,
            ) => {
                return new PoolKey(
                    [],
                    fields
                )
            },
            kind: "StructClassReified",
        }
    }

    static get r() {
        return PoolKey.reified()
    }

    static phantom(): PhantomReified<ToTypeStr<PoolKey>> {
        return phantom(PoolKey.reified());
    }

    static get p() {
        return PoolKey.phantom()
    }

    static get bcs() {
        return bcs.struct("PoolKey", {
            coin_type_a:
                TypeName.bcs
            , coin_type_b:
                TypeName.bcs

        })
    };

    static fromFields(
         fields: Record<string, any>
    ): PoolKey {
        return PoolKey.reified().new(
            {coinTypeA: decodeFromFields(TypeName.reified(), fields.coin_type_a), coinTypeB: decodeFromFields(TypeName.reified(), fields.coin_type_b)}
        )
    }

    static fromFieldsWithTypes(
         item: FieldsWithTypes
    ): PoolKey {
        if (!isPoolKey(item.type)) {
            throw new Error("not a PoolKey type");
        }

        return PoolKey.reified().new(
            {coinTypeA: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.coin_type_a), coinTypeB: decodeFromFieldsWithTypes(TypeName.reified(), item.fields.coin_type_b)}
        )
    }

    static fromBcs(
         data: Uint8Array
    ): PoolKey {

        return PoolKey.fromFields(
            PoolKey.bcs.parse(data)
        )
    }

    toJSONField() {
        return {
            coinTypeA: this.coinTypeA.toJSONField(),coinTypeB: this.coinTypeB.toJSONField(),

        }
    }

    toJSON() {
        return {
            $typeName: this.$typeName,
            $typeArgs: this.$typeArgs,
            ...this.toJSONField()
        }
    }

    static fromJSONField(
         field: any
    ): PoolKey {
        return PoolKey.reified().new(
            {coinTypeA: decodeFromJSONField(TypeName.reified(), field.coinTypeA), coinTypeB: decodeFromJSONField(TypeName.reified(), field.coinTypeB)}
        )
    }

    static fromJSON(
         json: Record<string, any>
    ): PoolKey {
        if (json.$typeName !== PoolKey.$typeName) {
            throw new Error("not a WithTwoGenerics json object")
        };

        return PoolKey.fromJSONField(
            json,
        )
    }

    static fromSuiParsedData(
         content: SuiParsedData
    ): PoolKey {
        if (content.dataType !== "moveObject") {
            throw new Error("not an object");
        }
        if (!isPoolKey(content.type)) {
            throw new Error(`object at ${(content.fields as any).id} is not a PoolKey object`);
        }
        return PoolKey.fromFieldsWithTypes(
            content
        );
    }

    static fromSuiObjectData(
         data: SuiObjectData
    ): PoolKey {
        if (data.bcs) {
            if (data.bcs.dataType !== "moveObject" || !isPoolKey(data.bcs.type)) {
                throw new Error(`object at is not a PoolKey object`);
            }

            return PoolKey.fromBcs(
                fromB64(data.bcs.bcsBytes)
            );
        }
        if (data.content) {
            return PoolKey.fromSuiParsedData(
                data.content
            )
        }

        throw new Error(
            "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request."
        );
    }

    static async fetch(
        client: SuiClient, id: string
    ): Promise<PoolKey> {
        const res = await client.getObject({
            id,
            options: {
                showBcs: true,
            },
        });
        if (res.error) {
            throw new Error(`error fetching PoolKey object at id ${id}: ${res.error.code}`);
        }
        if (res.data?.bcs?.dataType !== "moveObject" || !isPoolKey(res.data.bcs.type)) {
            throw new Error(`object at id ${id} is not a PoolKey object`);
        }

        return PoolKey.fromSuiObjectData(
            res.data
        );
    }
}

/* ============================== Registry =============================== */

export function isRegistry(type: string): boolean {
    type = compressSuiType(type);
    return type === `${PKG_V1}::registry::Registry`;
}

export interface RegistryFields {
    id: ToField<UID>; version: ToField<Version>; banks: ToField<Bag>; pools: ToField<Bag>
}

export type RegistryReified = Reified<
    Registry,
    RegistryFields
>;

export class Registry implements StructClass {
    __StructClass = true as const;

    static readonly $typeName = `${PKG_V1}::registry::Registry`;
    static readonly $numTypeParams = 0;
    static readonly $isPhantom = [] as const;

    readonly $typeName = Registry.$typeName;
    readonly $fullTypeName: `${typeof PKG_V1}::registry::Registry`;
    readonly $typeArgs: [];
    readonly $isPhantom = Registry.$isPhantom;

    readonly id:
        ToField<UID>
    ; readonly version:
        ToField<Version>
    ; readonly banks:
        ToField<Bag>
    ; readonly pools:
        ToField<Bag>

    private constructor(typeArgs: [], fields: RegistryFields,
    ) {
        this.$fullTypeName = composeSuiType(
            Registry.$typeName,
            ...typeArgs
        ) as `${typeof PKG_V1}::registry::Registry`;
        this.$typeArgs = typeArgs;

        this.id = fields.id;; this.version = fields.version;; this.banks = fields.banks;; this.pools = fields.pools;
    }

    static reified(): RegistryReified {
        return {
            typeName: Registry.$typeName,
            fullTypeName: composeSuiType(
                Registry.$typeName,
                ...[]
            ) as `${typeof PKG_V1}::registry::Registry`,
            typeArgs: [] as [],
            isPhantom: Registry.$isPhantom,
            reifiedTypeArgs: [],
            fromFields: (fields: Record<string, any>) =>
                Registry.fromFields(
                    fields,
                ),
            fromFieldsWithTypes: (item: FieldsWithTypes) =>
                Registry.fromFieldsWithTypes(
                    item,
                ),
            fromBcs: (data: Uint8Array) =>
                Registry.fromBcs(
                    data,
                ),
            bcs: Registry.bcs,
            fromJSONField: (field: any) =>
                Registry.fromJSONField(
                    field,
                ),
            fromJSON: (json: Record<string, any>) =>
                Registry.fromJSON(
                    json,
                ),
            fromSuiParsedData: (content: SuiParsedData) =>
                Registry.fromSuiParsedData(
                    content,
                ),
            fromSuiObjectData: (content: SuiObjectData) =>
                Registry.fromSuiObjectData(
                    content,
                ),
            fetch: async (client: SuiClient, id: string) => Registry.fetch(
                client,
                id,
            ),
            new: (
                fields: RegistryFields,
            ) => {
                return new Registry(
                    [],
                    fields
                )
            },
            kind: "StructClassReified",
        }
    }

    static get r() {
        return Registry.reified()
    }

    static phantom(): PhantomReified<ToTypeStr<Registry>> {
        return phantom(Registry.reified());
    }

    static get p() {
        return Registry.phantom()
    }

    static get bcs() {
        return bcs.struct("Registry", {
            id:
                UID.bcs
            , version:
                Version.bcs
            , banks:
                Bag.bcs
            , pools:
                Bag.bcs

        })
    };

    static fromFields(
         fields: Record<string, any>
    ): Registry {
        return Registry.reified().new(
            {id: decodeFromFields(UID.reified(), fields.id), version: decodeFromFields(Version.reified(), fields.version), banks: decodeFromFields(Bag.reified(), fields.banks), pools: decodeFromFields(Bag.reified(), fields.pools)}
        )
    }

    static fromFieldsWithTypes(
         item: FieldsWithTypes
    ): Registry {
        if (!isRegistry(item.type)) {
            throw new Error("not a Registry type");
        }

        return Registry.reified().new(
            {id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id), version: decodeFromFieldsWithTypes(Version.reified(), item.fields.version), banks: decodeFromFieldsWithTypes(Bag.reified(), item.fields.banks), pools: decodeFromFieldsWithTypes(Bag.reified(), item.fields.pools)}
        )
    }

    static fromBcs(
         data: Uint8Array
    ): Registry {

        return Registry.fromFields(
            Registry.bcs.parse(data)
        )
    }

    toJSONField() {
        return {
            id: this.id,version: this.version.toJSONField(),banks: this.banks.toJSONField(),pools: this.pools.toJSONField(),

        }
    }

    toJSON() {
        return {
            $typeName: this.$typeName,
            $typeArgs: this.$typeArgs,
            ...this.toJSONField()
        }
    }

    static fromJSONField(
         field: any
    ): Registry {
        return Registry.reified().new(
            {id: decodeFromJSONField(UID.reified(), field.id), version: decodeFromJSONField(Version.reified(), field.version), banks: decodeFromJSONField(Bag.reified(), field.banks), pools: decodeFromJSONField(Bag.reified(), field.pools)}
        )
    }

    static fromJSON(
         json: Record<string, any>
    ): Registry {
        if (json.$typeName !== Registry.$typeName) {
            throw new Error("not a WithTwoGenerics json object")
        };

        return Registry.fromJSONField(
            json,
        )
    }

    static fromSuiParsedData(
         content: SuiParsedData
    ): Registry {
        if (content.dataType !== "moveObject") {
            throw new Error("not an object");
        }
        if (!isRegistry(content.type)) {
            throw new Error(`object at ${(content.fields as any).id} is not a Registry object`);
        }
        return Registry.fromFieldsWithTypes(
            content
        );
    }

    static fromSuiObjectData(
         data: SuiObjectData
    ): Registry {
        if (data.bcs) {
            if (data.bcs.dataType !== "moveObject" || !isRegistry(data.bcs.type)) {
                throw new Error(`object at is not a Registry object`);
            }

            return Registry.fromBcs(
                fromB64(data.bcs.bcsBytes)
            );
        }
        if (data.content) {
            return Registry.fromSuiParsedData(
                data.content
            )
        }

        throw new Error(
            "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request."
        );
    }

    static async fetch(
        client: SuiClient, id: string
    ): Promise<Registry> {
        const res = await client.getObject({
            id,
            options: {
                showBcs: true,
            },
        });
        if (res.error) {
            throw new Error(`error fetching Registry object at id ${id}: ${res.error.code}`);
        }
        if (res.data?.bcs?.dataType !== "moveObject" || !isRegistry(res.data.bcs.type)) {
            throw new Error(`object at id ${id} is not a Registry object`);
        }

        return Registry.fromSuiObjectData(
            res.data
        );
    }
}
