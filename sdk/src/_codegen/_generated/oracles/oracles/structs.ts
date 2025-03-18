import * as reified from "../../_framework/reified";
import { Option } from "../../_dependencies/source/0x1/option/structs";
import { Bag } from "../../_dependencies/source/0x2/bag/structs";
import { ID, UID } from "../../_dependencies/source/0x2/object/structs";
import { PriceFeed } from "../../_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/price-feed/structs";
import { PriceIdentifier } from "../../_dependencies/source/0x8d97f1cd6ac663735be08d1d2b6d02a159e711586461306ce60a2b7a6a565a9e/price-identifier/structs";
import { CurrentResult } from "../../_dependencies/source/0xc3c7e6eb7202e9fb0389a2f7542b91cc40e4f7a33c02554fec11c4c92f938ea3/aggregator/structs";
import {
  EnumClass,
  PhantomReified,
  Reified,
  StructClass,
  ToField,
  ToTypeStr,
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  fieldToJSON,
  phantom,
} from "../../_framework/reified";
import {
  FieldsWithTypes,
  composeSuiType,
  compressSuiType,
} from "../../_framework/util";
import { Vector } from "../../_framework/vector";
import { PKG_V1 } from "../index";
import { OracleDecimal } from "../oracle-decimal/structs";
import { Version } from "../version/structs";
import { EnumOutputShapeWithKeys } from "@mysten/bcs";
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== AdminCap =============================== */

export function isAdminCap(type: string): boolean {
  type = compressSuiType(type);
  return /^0x[a-fA-F0-9]+::oracles::AdminCap$/.test(type);
}

export interface AdminCapFields {
  id: ToField<UID>;
  oracleRegistryId: ToField<ID>;
}

export type AdminCapReified = Reified<AdminCap, AdminCapFields>;

export class AdminCap implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::oracles::AdminCap`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = AdminCap.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::oracles::AdminCap`;
  readonly $typeArgs: [];
  readonly $isPhantom = AdminCap.$isPhantom;

  readonly id: ToField<UID>;
  readonly oracleRegistryId: ToField<ID>;

  private constructor(typeArgs: [], fields: AdminCapFields) {
    this.$fullTypeName = composeSuiType(
      AdminCap.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::AdminCap`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.oracleRegistryId = fields.oracleRegistryId;
  }

  static reified(): AdminCapReified {
    return {
      typeName: AdminCap.$typeName,
      fullTypeName: composeSuiType(
        AdminCap.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::AdminCap`,
      typeArgs: [] as [],
      isPhantom: AdminCap.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => AdminCap.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        AdminCap.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => AdminCap.fromBcs(data),
      bcs: AdminCap.bcs,
      fromJSONField: (field: any) => AdminCap.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => AdminCap.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        AdminCap.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        AdminCap.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        AdminCap.fetch(client, id),
      new: (fields: AdminCapFields) => {
        return new AdminCap([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return AdminCap.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<AdminCap>> {
    return phantom(AdminCap.reified());
  }
  static get p() {
    return AdminCap.phantom();
  }

  static get bcs() {
    return bcs.struct("AdminCap", {
      id: UID.bcs,
      oracleRegistryId: ID.bcs,
    });
  }

  static fromFields(fields: Record<string, any>): AdminCap {
    return AdminCap.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      oracleRegistryId: decodeFromFields(ID.reified(), fields.oracleRegistryId),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): AdminCap {
    if (!isAdminCap(item.type)) {
      throw new Error("not a AdminCap type");
    }

    return AdminCap.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      oracleRegistryId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.oracle_registry_id,
      ),
    });
  }

  static fromBcs(data: Uint8Array): AdminCap {
    return AdminCap.fromFields(AdminCap.bcs.parse(data));
  }

  toJSONField() {
    return {
      id: this.id,
      oracleRegistryId: this.oracleRegistryId,
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): AdminCap {
    return AdminCap.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      oracleRegistryId: decodeFromJSONField(
        ID.reified(),
        field.oracleRegistryId,
      ),
    });
  }

  static fromJSON(json: Record<string, any>): AdminCap {
    if (json.$typeName !== AdminCap.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return AdminCap.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): AdminCap {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isAdminCap(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a AdminCap object`,
      );
    }
    return AdminCap.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): AdminCap {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isAdminCap(data.bcs.type)) {
        throw new Error(`object at is not a AdminCap object`);
      }

      return AdminCap.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return AdminCap.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<AdminCap> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching AdminCap object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isAdminCap(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a AdminCap object`);
    }

    return AdminCap.fromSuiObjectData(res.data);
  }
}

/* ============================== Oracle =============================== */

export function isOracle(type: string): boolean {
  type = compressSuiType(type);
  return /^0x[a-fA-F0-9]+::oracles::Oracle$/.test(type);
}

export interface OracleFields {
  oracleType: ToField<OracleType>;
  extraFields: ToField<Bag>;
}

export type OracleReified = Reified<Oracle, OracleFields>;

export class Oracle implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::oracles::Oracle`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = Oracle.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::oracles::Oracle`;
  readonly $typeArgs: [];
  readonly $isPhantom = Oracle.$isPhantom;

  readonly oracleType: ToField<OracleType>;
  readonly extraFields: ToField<Bag>;

  private constructor(typeArgs: [], fields: OracleFields) {
    this.$fullTypeName = composeSuiType(
      Oracle.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::Oracle`;
    this.$typeArgs = typeArgs;

    this.oracleType = fields.oracleType;
    this.extraFields = fields.extraFields;
  }

  static reified(): OracleReified {
    return {
      typeName: Oracle.$typeName,
      fullTypeName: composeSuiType(
        Oracle.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::Oracle`,
      typeArgs: [] as [],
      isPhantom: Oracle.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) => Oracle.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        Oracle.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => Oracle.fromBcs(data),
      bcs: Oracle.bcs,
      fromJSONField: (field: any) => Oracle.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => Oracle.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        Oracle.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        Oracle.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) => Oracle.fetch(client, id),
      new: (fields: OracleFields) => {
        return new Oracle([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return Oracle.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<Oracle>> {
    return phantom(Oracle.reified());
  }
  static get p() {
    return Oracle.phantom();
  }

  static get bcs() {
    return bcs.struct("Oracle", {
      oracleType: OracleType.bcs,
      extraFields: Bag.bcs,
    });
  }

  static fromFields(fields: Record<string, any>): Oracle {
    return Oracle.reified().new({
      oracleType: decodeFromFields(OracleType.reified(), fields.oracleType),
      extraFields: decodeFromFields(Bag.reified(), fields.extraFields),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): Oracle {
    if (!isOracle(item.type)) {
      throw new Error("not a Oracle type");
    }

    return Oracle.reified().new({
      oracleType: decodeFromFieldsWithTypes(
        OracleType.reified(),
        item.fields.oracle_type, // error is here NOTE
      ),
      extraFields: decodeFromFieldsWithTypes(
        Bag.reified(),
        item.fields.extra_fields,
      ),
    });
  }

  static fromBcs(data: Uint8Array): Oracle {
    return Oracle.fromFields(Oracle.bcs.parse(data));
  }

  toJSONField() {
    return {
      oracleType: this.oracleType.toJSONField(),
      extraFields: this.extraFields.toJSONField(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): Oracle {
    return Oracle.reified().new({
      oracleType: decodeFromJSONField(OracleType.reified(), field.oracleType),
      extraFields: decodeFromJSONField(Bag.reified(), field.extraFields),
    });
  }

  static fromJSON(json: Record<string, any>): Oracle {
    if (json.$typeName !== Oracle.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return Oracle.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): Oracle {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isOracle(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a Oracle object`,
      );
    }
    return Oracle.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): Oracle {
    if (data.bcs) {
      if (data.bcs.dataType !== "moveObject" || !isOracle(data.bcs.type)) {
        throw new Error(`object at is not a Oracle object`);
      }

      return Oracle.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return Oracle.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<Oracle> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching Oracle object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isOracle(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a Oracle object`);
    }

    return Oracle.fromSuiObjectData(res.data);
  }
}

/* ============================== OraclePriceUpdate =============================== */

export function isOraclePriceUpdate(type: string): boolean {
  type = compressSuiType(type);
  return /^0x[a-fA-F0-9]+::oracles::OraclePriceUpdate$/.test(type);
}

export interface OraclePriceUpdateFields {
  oracleRegistryId: ToField<ID>;
  oracleIndex: ToField<"u64">;
  price: ToField<OracleDecimal>;
  emaPrice: ToField<Option<OracleDecimal>>;
  metadata: ToField<OracleMetadata>;
}

export type OraclePriceUpdateReified = Reified<
  OraclePriceUpdate,
  OraclePriceUpdateFields
>;

export class OraclePriceUpdate implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::oracles::OraclePriceUpdate`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = OraclePriceUpdate.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::oracles::OraclePriceUpdate`;
  readonly $typeArgs: [];
  readonly $isPhantom = OraclePriceUpdate.$isPhantom;

  readonly oracleRegistryId: ToField<ID>;
  readonly oracleIndex: ToField<"u64">;
  readonly price: ToField<OracleDecimal>;
  readonly emaPrice: ToField<Option<OracleDecimal>>;
  readonly metadata: ToField<OracleMetadata>;

  private constructor(typeArgs: [], fields: OraclePriceUpdateFields) {
    this.$fullTypeName = composeSuiType(
      OraclePriceUpdate.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::OraclePriceUpdate`;
    this.$typeArgs = typeArgs;

    this.oracleRegistryId = fields.oracleRegistryId;
    this.oracleIndex = fields.oracleIndex;
    this.price = fields.price;
    this.emaPrice = fields.emaPrice;
    this.metadata = fields.metadata;
  }

  static reified(): OraclePriceUpdateReified {
    return {
      typeName: OraclePriceUpdate.$typeName,
      fullTypeName: composeSuiType(
        OraclePriceUpdate.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::OraclePriceUpdate`,
      typeArgs: [] as [],
      isPhantom: OraclePriceUpdate.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        OraclePriceUpdate.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        OraclePriceUpdate.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => OraclePriceUpdate.fromBcs(data),
      bcs: OraclePriceUpdate.bcs,
      fromJSONField: (field: any) => OraclePriceUpdate.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => OraclePriceUpdate.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        OraclePriceUpdate.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        OraclePriceUpdate.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        OraclePriceUpdate.fetch(client, id),
      new: (fields: OraclePriceUpdateFields) => {
        return new OraclePriceUpdate([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return OraclePriceUpdate.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<OraclePriceUpdate>> {
    return phantom(OraclePriceUpdate.reified());
  }
  static get p() {
    return OraclePriceUpdate.phantom();
  }

  static get bcs() {
    return bcs.struct("OraclePriceUpdate", {
      oracleRegistryId: ID.bcs,
      oracleIndex: bcs.u64(),
      price: OracleDecimal.bcs,
      emaPrice: Option.bcs(OracleDecimal.bcs),
      metadata: OracleMetadata.bcs,
    });
  }

  static fromFields(fields: Record<string, any>): OraclePriceUpdate {
    return OraclePriceUpdate.reified().new({
      oracleRegistryId: decodeFromFields(ID.reified(), fields.oracleRegistryId),
      oracleIndex: decodeFromFields("u64", fields.oracleIndex),
      price: decodeFromFields(OracleDecimal.reified(), fields.price),
      emaPrice: decodeFromFields(
        Option.reified(OracleDecimal.reified()),
        fields.emaPrice,
      ),
      metadata: decodeFromFields(OracleMetadata.reified(), fields.metadata),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): OraclePriceUpdate {
    if (!isOraclePriceUpdate(item.type)) {
      throw new Error("not a OraclePriceUpdate type");
    }

    return OraclePriceUpdate.reified().new({
      oracleRegistryId: decodeFromFieldsWithTypes(
        ID.reified(),
        item.fields.oracle_registry_id,
      ),
      oracleIndex: decodeFromFieldsWithTypes("u64", item.fields.oracle_index),
      price: decodeFromFieldsWithTypes(
        OracleDecimal.reified(),
        item.fields.price,
      ),
      emaPrice: decodeFromFieldsWithTypes(
        Option.reified(OracleDecimal.reified()),
        item.fields.ema_price,
      ),
      metadata: decodeFromFieldsWithTypes(
        OracleMetadata.reified(),
        item.fields.metadata,
      ),
    });
  }

  static fromBcs(data: Uint8Array): OraclePriceUpdate {
    return OraclePriceUpdate.fromFields(OraclePriceUpdate.bcs.parse(data));
  }

  toJSONField() {
    return {
      oracleRegistryId: this.oracleRegistryId,
      oracleIndex: this.oracleIndex.toString(),
      price: this.price.toJSONField(),
      emaPrice: fieldToJSON<Option<OracleDecimal>>(
        `${Option.$typeName}<${OracleDecimal.$typeName}>`,
        this.emaPrice,
      ),
      metadata: this.metadata.toJSONField(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): OraclePriceUpdate {
    return OraclePriceUpdate.reified().new({
      oracleRegistryId: decodeFromJSONField(
        ID.reified(),
        field.oracleRegistryId,
      ),
      oracleIndex: decodeFromJSONField("u64", field.oracleIndex),
      price: decodeFromJSONField(OracleDecimal.reified(), field.price),
      emaPrice: decodeFromJSONField(
        Option.reified(OracleDecimal.reified()),
        field.emaPrice,
      ),
      metadata: decodeFromJSONField(OracleMetadata.reified(), field.metadata),
    });
  }

  static fromJSON(json: Record<string, any>): OraclePriceUpdate {
    if (json.$typeName !== OraclePriceUpdate.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return OraclePriceUpdate.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): OraclePriceUpdate {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isOraclePriceUpdate(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a OraclePriceUpdate object`,
      );
    }
    return OraclePriceUpdate.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): OraclePriceUpdate {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isOraclePriceUpdate(data.bcs.type)
      ) {
        throw new Error(`object at is not a OraclePriceUpdate object`);
      }

      return OraclePriceUpdate.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return OraclePriceUpdate.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SuiClient,
    id: string,
  ): Promise<OraclePriceUpdate> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching OraclePriceUpdate object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isOraclePriceUpdate(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a OraclePriceUpdate object`);
    }

    return OraclePriceUpdate.fromSuiObjectData(res.data);
  }
}

/* ============================== OracleRegistry =============================== */

export function isOracleRegistry(type: string): boolean {
  type = compressSuiType(type);
  return /^0x[a-fA-F0-9]+::oracles::OracleRegistry$/.test(type);
}

export interface OracleRegistryFields {
  id: ToField<UID>;
  config: ToField<OracleRegistryConfig>;
  oracles: ToField<Vector<Oracle>>;
  version: ToField<Version>;
  extraFields: ToField<Bag>;
}

export type OracleRegistryReified = Reified<
  OracleRegistry,
  OracleRegistryFields
>;

export class OracleRegistry implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::oracles::OracleRegistry`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = OracleRegistry.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::oracles::OracleRegistry`;
  readonly $typeArgs: [];
  readonly $isPhantom = OracleRegistry.$isPhantom;

  readonly id: ToField<UID>;
  readonly config: ToField<OracleRegistryConfig>;
  readonly oracles: ToField<Vector<Oracle>>;
  readonly version: ToField<Version>;
  readonly extraFields: ToField<Bag>;

  private constructor(typeArgs: [], fields: OracleRegistryFields) {
    this.$fullTypeName = composeSuiType(
      OracleRegistry.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::OracleRegistry`;
    this.$typeArgs = typeArgs;

    this.id = fields.id;
    this.config = fields.config;
    this.oracles = fields.oracles;
    this.version = fields.version;
    this.extraFields = fields.extraFields;
  }

  static reified(): OracleRegistryReified {
    return {
      typeName: OracleRegistry.$typeName,
      fullTypeName: composeSuiType(
        OracleRegistry.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::OracleRegistry`,
      typeArgs: [] as [],
      isPhantom: OracleRegistry.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        OracleRegistry.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        OracleRegistry.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => OracleRegistry.fromBcs(data),
      bcs: OracleRegistry.bcs,
      fromJSONField: (field: any) => OracleRegistry.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => OracleRegistry.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        OracleRegistry.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        OracleRegistry.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        OracleRegistry.fetch(client, id),
      new: (fields: OracleRegistryFields) => {
        return new OracleRegistry([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return OracleRegistry.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<OracleRegistry>> {
    return phantom(OracleRegistry.reified());
  }
  static get p() {
    return OracleRegistry.phantom();
  }

  static get bcs() {
    return bcs.struct("OracleRegistry", {
      id: UID.bcs,
      config: OracleRegistryConfig.bcs,
      oracles: bcs.vector(Oracle.bcs),
      version: Version.bcs,
      extraFields: Bag.bcs,
    });
  }

  static fromFields(fields: Record<string, any>): OracleRegistry {
    return OracleRegistry.reified().new({
      id: decodeFromFields(UID.reified(), fields.id),
      config: decodeFromFields(OracleRegistryConfig.reified(), fields.config),
      oracles: decodeFromFields(
        reified.vector(Oracle.reified()),
        fields.oracles,
      ),
      version: decodeFromFields(Version.reified(), fields.version),
      extraFields: decodeFromFields(Bag.reified(), fields.extraFields),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): OracleRegistry {
    if (!isOracleRegistry(item.type)) {
      throw new Error("not a OracleRegistry type");
    }

    return OracleRegistry.reified().new({
      id: decodeFromFieldsWithTypes(UID.reified(), item.fields.id),
      config: decodeFromFieldsWithTypes(
        OracleRegistryConfig.reified(),
        item.fields.config,
      ),
      oracles: decodeFromFieldsWithTypes(
        reified.vector(Oracle.reified()),
        item.fields.oracles,
      ),
      version: decodeFromFieldsWithTypes(
        Version.reified(),
        item.fields.version,
      ),
      extraFields: decodeFromFieldsWithTypes(
        Bag.reified(),
        item.fields.extra_fields,
      ),
    });
  }

  static fromBcs(data: Uint8Array): OracleRegistry {
    return OracleRegistry.fromFields(OracleRegistry.bcs.parse(data));
  }

  toJSONField() {
    return {
      id: this.id,
      config: this.config.toJSONField(),
      oracles: fieldToJSON<Vector<Oracle>>(
        `vector<${Oracle.$typeName}>`,
        this.oracles,
      ),
      version: this.version.toJSONField(),
      extraFields: this.extraFields.toJSONField(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): OracleRegistry {
    return OracleRegistry.reified().new({
      id: decodeFromJSONField(UID.reified(), field.id),
      config: decodeFromJSONField(OracleRegistryConfig.reified(), field.config),
      oracles: decodeFromJSONField(
        reified.vector(Oracle.reified()),
        field.oracles,
      ),
      version: decodeFromJSONField(Version.reified(), field.version),
      extraFields: decodeFromJSONField(Bag.reified(), field.extraFields),
    });
  }

  static fromJSON(json: Record<string, any>): OracleRegistry {
    if (json.$typeName !== OracleRegistry.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return OracleRegistry.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): OracleRegistry {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isOracleRegistry(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a OracleRegistry object`,
      );
    }
    return OracleRegistry.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): OracleRegistry {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isOracleRegistry(data.bcs.type)
      ) {
        throw new Error(`object at is not a OracleRegistry object`);
      }

      return OracleRegistry.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return OracleRegistry.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<OracleRegistry> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching OracleRegistry object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isOracleRegistry(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a OracleRegistry object`);
    }

    return OracleRegistry.fromSuiObjectData(res.data);
  }
}

/* ============================== OracleRegistryConfig =============================== */

export function isOracleRegistryConfig(type: string): boolean {
  type = compressSuiType(type);
  return /^0x[a-fA-F0-9]+::oracles::OracleRegistryConfig$/.test(type);
}

export interface OracleRegistryConfigFields {
  pythMaxStalenessThresholdS: ToField<"u64">;
  pythMaxConfidenceIntervalPct: ToField<"u64">;
  switchboardMaxStalenessThresholdS: ToField<"u64">;
  switchboardMaxConfidenceIntervalPct: ToField<"u64">;
  extraFields: ToField<Bag>;
}

export type OracleRegistryConfigReified = Reified<
  OracleRegistryConfig,
  OracleRegistryConfigFields
>;

export class OracleRegistryConfig implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::oracles::OracleRegistryConfig`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = OracleRegistryConfig.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::oracles::OracleRegistryConfig`;
  readonly $typeArgs: [];
  readonly $isPhantom = OracleRegistryConfig.$isPhantom;

  readonly pythMaxStalenessThresholdS: ToField<"u64">;
  readonly pythMaxConfidenceIntervalPct: ToField<"u64">;
  readonly switchboardMaxStalenessThresholdS: ToField<"u64">;
  readonly switchboardMaxConfidenceIntervalPct: ToField<"u64">;
  readonly extraFields: ToField<Bag>;

  private constructor(typeArgs: [], fields: OracleRegistryConfigFields) {
    this.$fullTypeName = composeSuiType(
      OracleRegistryConfig.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::OracleRegistryConfig`;
    this.$typeArgs = typeArgs;

    this.pythMaxStalenessThresholdS = fields.pythMaxStalenessThresholdS;
    this.pythMaxConfidenceIntervalPct = fields.pythMaxConfidenceIntervalPct;
    this.switchboardMaxStalenessThresholdS =
      fields.switchboardMaxStalenessThresholdS;
    this.switchboardMaxConfidenceIntervalPct =
      fields.switchboardMaxConfidenceIntervalPct;
    this.extraFields = fields.extraFields;
  }

  static reified(): OracleRegistryConfigReified {
    return {
      typeName: OracleRegistryConfig.$typeName,
      fullTypeName: composeSuiType(
        OracleRegistryConfig.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::OracleRegistryConfig`,
      typeArgs: [] as [],
      isPhantom: OracleRegistryConfig.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        OracleRegistryConfig.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        OracleRegistryConfig.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => OracleRegistryConfig.fromBcs(data),
      bcs: OracleRegistryConfig.bcs,
      fromJSONField: (field: any) => OracleRegistryConfig.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        OracleRegistryConfig.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        OracleRegistryConfig.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        OracleRegistryConfig.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        OracleRegistryConfig.fetch(client, id),
      new: (fields: OracleRegistryConfigFields) => {
        return new OracleRegistryConfig([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return OracleRegistryConfig.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<OracleRegistryConfig>> {
    return phantom(OracleRegistryConfig.reified());
  }
  static get p() {
    return OracleRegistryConfig.phantom();
  }

  static get bcs() {
    return bcs.struct("OracleRegistryConfig", {
      pythMaxStalenessThresholdS: bcs.u64(),
      pythMaxConfidenceIntervalPct: bcs.u64(),
      switchboardMaxStalenessThresholdS: bcs.u64(),
      switchboardMaxConfidenceIntervalPct: bcs.u64(),
      extraFields: Bag.bcs,
    });
  }

  static fromFields(fields: Record<string, any>): OracleRegistryConfig {
    return OracleRegistryConfig.reified().new({
      pythMaxStalenessThresholdS: decodeFromFields(
        "u64",
        fields.pythMaxStalenessThresholdS,
      ),
      pythMaxConfidenceIntervalPct: decodeFromFields(
        "u64",
        fields.pythMaxConfidenceIntervalPct,
      ),
      switchboardMaxStalenessThresholdS: decodeFromFields(
        "u64",
        fields.switchboardMaxStalenessThresholdS,
      ),
      switchboardMaxConfidenceIntervalPct: decodeFromFields(
        "u64",
        fields.switchboardMaxConfidenceIntervalPct,
      ),
      extraFields: decodeFromFields(Bag.reified(), fields.extraFields),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): OracleRegistryConfig {
    if (!isOracleRegistryConfig(item.type)) {
      throw new Error("not a OracleRegistryConfig type");
    }

    return OracleRegistryConfig.reified().new({
      pythMaxStalenessThresholdS: decodeFromFieldsWithTypes(
        "u64",
        item.fields.pyth_max_staleness_threshold_s,
      ),
      pythMaxConfidenceIntervalPct: decodeFromFieldsWithTypes(
        "u64",
        item.fields.pyth_max_confidence_interval_pct,
      ),
      switchboardMaxStalenessThresholdS: decodeFromFieldsWithTypes(
        "u64",
        item.fields.switchboard_max_staleness_threshold_s,
      ),
      switchboardMaxConfidenceIntervalPct: decodeFromFieldsWithTypes(
        "u64",
        item.fields.switchboard_max_confidence_interval_pct,
      ),
      extraFields: decodeFromFieldsWithTypes(
        Bag.reified(),
        item.fields.extra_fields,
      ),
    });
  }

  static fromBcs(data: Uint8Array): OracleRegistryConfig {
    return OracleRegistryConfig.fromFields(
      OracleRegistryConfig.bcs.parse(data),
    );
  }

  toJSONField() {
    return {
      pythMaxStalenessThresholdS: this.pythMaxStalenessThresholdS.toString(),
      pythMaxConfidenceIntervalPct:
        this.pythMaxConfidenceIntervalPct.toString(),
      switchboardMaxStalenessThresholdS:
        this.switchboardMaxStalenessThresholdS.toString(),
      switchboardMaxConfidenceIntervalPct:
        this.switchboardMaxConfidenceIntervalPct.toString(),
      extraFields: this.extraFields.toJSONField(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): OracleRegistryConfig {
    return OracleRegistryConfig.reified().new({
      pythMaxStalenessThresholdS: decodeFromJSONField(
        "u64",
        field.pythMaxStalenessThresholdS,
      ),
      pythMaxConfidenceIntervalPct: decodeFromJSONField(
        "u64",
        field.pythMaxConfidenceIntervalPct,
      ),
      switchboardMaxStalenessThresholdS: decodeFromJSONField(
        "u64",
        field.switchboardMaxStalenessThresholdS,
      ),
      switchboardMaxConfidenceIntervalPct: decodeFromJSONField(
        "u64",
        field.switchboardMaxConfidenceIntervalPct,
      ),
      extraFields: decodeFromJSONField(Bag.reified(), field.extraFields),
    });
  }

  static fromJSON(json: Record<string, any>): OracleRegistryConfig {
    if (json.$typeName !== OracleRegistryConfig.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return OracleRegistryConfig.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): OracleRegistryConfig {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isOracleRegistryConfig(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a OracleRegistryConfig object`,
      );
    }
    return OracleRegistryConfig.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): OracleRegistryConfig {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isOracleRegistryConfig(data.bcs.type)
      ) {
        throw new Error(`object at is not a OracleRegistryConfig object`);
      }

      return OracleRegistryConfig.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return OracleRegistryConfig.fromSuiParsedData(data.content);
    }
    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SuiClient,
    id: string,
  ): Promise<OracleRegistryConfig> {
    const res = await client.getObject({ id, options: { showBcs: true } });
    if (res.error) {
      throw new Error(
        `error fetching OracleRegistryConfig object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isOracleRegistryConfig(res.data.bcs.type)
    ) {
      throw new Error(
        `object at id ${id} is not a OracleRegistryConfig object`,
      );
    }

    return OracleRegistryConfig.fromSuiObjectData(res.data);
  }
}

/* ============================== OracleMetadata =============================== */

export function isOracleMetadata(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::oracles::OracleMetadata`);
}

export type OracleMetadataVariants = EnumOutputShapeWithKeys<
  {
    pyth: { priceFeed: ToField<PriceFeed> };
    switchboard: { currentResult: ToField<CurrentResult> };
  },
  "pyth" | "switchboard"
>;

export type OracleMetadataReified = Reified<
  OracleMetadata,
  OracleMetadataVariants
>;

export class OracleMetadata implements EnumClass {
  static readonly $typeName = `${PKG_V1}::oracles::OracleMetadata`;
  static readonly $numTypeParams = 0;

  readonly $typeName = OracleMetadata.$typeName;

  readonly $fullTypeName: `${typeof PKG_V1}::oracles::OracleMetadata`;

  readonly $typeArgs: [];
  readonly $data: OracleMetadataVariants;

  private constructor(typeArgs: [], data: OracleMetadataVariants) {
    this.$fullTypeName = composeSuiType(
      OracleMetadata.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::OracleMetadata`;
    this.$typeArgs = typeArgs;

    this.$data = data;
  }

  toJSONField() {
    throw new Error("NOT IMPLEMENTED");
  }

  static reified(): OracleMetadataReified {
    return {
      typeName: OracleMetadata.$typeName,
      fullTypeName: composeSuiType(
        OracleMetadata.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::OracleMetadata`,
      typeArgs: [] as [],
      reifiedTypeArgs: [],
      fromBcs: (data: Uint8Array) => OracleMetadata.fromBcs(data),
      fromFields: (data: EnumOutputShapeWithKeys<any, any>) =>
        OracleMetadata.fromFields(data),
      fromFieldsWithTypes: (data: EnumOutputShapeWithKeys<any, any>) =>
        OracleMetadata.fromFieldsWithTypes(data),
      bcs: OracleMetadata.bcs,
      new: (data: OracleMetadataVariants) => {
        return new OracleMetadata([], data);
      },
      kind: "EnumClassReified",
    };
  }

  static get r() {
    return OracleMetadata.reified();
  }

  static get bcs() {
    return bcs.enum("OracleMetadata", {
      pyth: bcs.struct("pyth", { priceFeed: PriceFeed.bcs }),
      switchboard: bcs.struct("switchboard", {
        currentResult: CurrentResult.bcs,
      }),
    });
  }

  static fromFields(data: EnumOutputShapeWithKeys<any, any>): OracleMetadata {
    switch (data.$kind) {
      case "pyth":
        return OracleMetadata.reified().new({
          pyth: {
            priceFeed: decodeFromFields(
              PriceFeed.reified(),
              data.pyth!.priceFeed,
            ),
          },
          $kind: "pyth",
        });

      case "switchboard":
        return OracleMetadata.reified().new({
          switchboard: {
            currentResult: decodeFromFields(
              CurrentResult.reified(),
              data.switchboard!.currentResult,
            ),
          },
          $kind: "switchboard",
        });

      default:
        throw new Error(" unknown variant: " + data.$kind);
    }
  }

  static fromFieldsWithTypes(
    data: EnumOutputShapeWithKeys<any, any>,
  ): OracleMetadata {
    switch (data.$kind) {
      case "pyth":
        return OracleMetadata.reified().new({
          pyth: {
            priceFeed: decodeFromFieldsWithTypes(
              PriceFeed.reified(),
              data.pyth!.priceFeed,
            ),
          },
          $kind: "pyth",
        });

      case "switchboard":
        return OracleMetadata.reified().new({
          switchboard: {
            currentResult: decodeFromFieldsWithTypes(
              CurrentResult.reified(),
              data.switchboard!.currentResult,
            ),
          },
          $kind: "switchboard",
        });

      default:
        throw new Error(" unknown variant: " + data.$kind);
    }
  }

  static fromBcs(data: Uint8Array): OracleMetadata {
    return OracleMetadata.fromFields(OracleMetadata.bcs.parse(data));
  }
}

/* ============================== OracleType =============================== */

export function isOracleType(type: string): boolean {
  type = compressSuiType(type);
  return type.startsWith(`${PKG_V1}::oracles::OracleType`);
}

export type OracleTypeVariants = EnumOutputShapeWithKeys<
  {
    pyth: { priceIdentifier: ToField<PriceIdentifier> };
    switchboard: { feedId: ToField<ID> };
  },
  "pyth" | "switchboard"
>;

export type OracleTypeReified = Reified<OracleType, OracleTypeVariants>;

export class OracleType implements EnumClass {
  static readonly $typeName = `${PKG_V1}::oracles::OracleType`;
  static readonly $numTypeParams = 0;

  readonly $typeName = OracleType.$typeName;

  readonly $fullTypeName: `${typeof PKG_V1}::oracles::OracleType`;

  readonly $typeArgs: [];
  readonly $data: OracleTypeVariants;

  private constructor(typeArgs: [], data: OracleTypeVariants) {
    this.$fullTypeName = composeSuiType(
      OracleType.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::oracles::OracleType`;
    this.$typeArgs = typeArgs;

    this.$data = data;
  }

  toJSONField() {
    throw new Error("NOT IMPLEMENTED");
  }

  static reified(): OracleTypeReified {
    return {
      typeName: OracleType.$typeName,
      fullTypeName: composeSuiType(
        OracleType.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::oracles::OracleType`,
      typeArgs: [] as [],
      reifiedTypeArgs: [],
      fromBcs: (data: Uint8Array) => OracleType.fromBcs(data),
      fromFields: (data: EnumOutputShapeWithKeys<any, any>) =>
        OracleType.fromFields(data),
      fromFieldsWithTypes: (data: EnumOutputShapeWithKeys<any, any>) =>
        OracleType.fromFieldsWithTypes(data),
      bcs: OracleType.bcs,
      new: (data: OracleTypeVariants) => {
        return new OracleType([], data);
      },
      kind: "EnumClassReified",
    };
  }

  static get r() {
    return OracleType.reified();
  }

  static get bcs() {
    return bcs.enum("OracleType", {
      pyth: bcs.struct("pyth", { priceIdentifier: PriceIdentifier.bcs }),
      switchboard: bcs.struct("switchboard", { feedId: ID.bcs }),
    });
  }

  static fromFields(data: EnumOutputShapeWithKeys<any, any>): OracleType {
    switch (data.$kind) {
      case "pyth":
        return OracleType.reified().new({
          pyth: {
            priceIdentifier: decodeFromFields(
              PriceIdentifier.reified(),
              data.pyth!.priceIdentifier,
            ),
          },
          $kind: "pyth",
        });

      case "switchboard":
        return OracleType.reified().new({
          switchboard: {
            feedId: decodeFromFields(ID.reified(), data.switchboard!.feedId),
          },
          $kind: "switchboard",
        });

      default:
        throw new Error(" unknown variant: " + data.$kind);
    }
  }

  static fromFieldsWithTypes(
    data: EnumOutputShapeWithKeys<any, any>,
  ): OracleType {
    switch (data.variant) {
      case "Pyth":
        return OracleType.reified().new({
          pyth: {
            priceIdentifier: decodeFromFieldsWithTypes(
              PriceIdentifier.reified(),
              data.fields.price_identifier,
            ),
          },
          $kind: "pyth",
        });

      case "Switchboard":
        return OracleType.reified().new({
          switchboard: {
            feedId: decodeFromFieldsWithTypes(
              ID.reified(),
              data.fields.feed_id,
            ),
          },
          $kind: "switchboard",
        });

      default:
        throw new Error(" unknown variant: " + data.variant);
    }
  }

  static fromBcs(data: Uint8Array): OracleType {
    return OracleType.fromFields(OracleType.bcs.parse(data));
  }
}
