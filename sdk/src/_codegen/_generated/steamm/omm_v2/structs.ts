import {
  PhantomReified,
  Reified,
  StructClass,
  ToField,
  ToTypeStr,
  decodeFromFields,
  decodeFromFieldsWithTypes,
  decodeFromJSONField,
  phantom,
} from "../../_framework/reified";
import {
  FieldsWithTypes,
  composeSuiType,
  compressSuiType,
} from "../../_framework/util";
import { ORACLE_V2_PKG_V1 } from "../index";
import { ID, UID } from "../../_dependencies/source/0x2/object/structs";
import { Version } from "../version/structs";
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== OracleQuoterV2 =============================== */

export function isOracleQuoterV2(type: string): boolean {
  type = compressSuiType(type);
  return type === `${ORACLE_V2_PKG_V1}::omm_v2::OracleQuoterV2`;
}

export interface OracleQuoterV2Fields {
  version: ToField<Version>;
  oracleRegistryId: ToField<ID>;
  oracleIndexA: ToField<"u64">;
  oracleIndexB: ToField<"u64">;
  decimalsA: ToField<"u8">;
  decimalsB: ToField<"u8">;
  amp: ToField<"u64">;
}

export type OracleQuoterV2Reified = Reified<
  OracleQuoterV2,
  OracleQuoterV2Fields
>;

export class OracleQuoterV2 implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${ORACLE_V2_PKG_V1}::omm_v2::OracleQuoterV2`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = OracleQuoterV2.$typeName;
  readonly $fullTypeName: `${typeof ORACLE_V2_PKG_V1}::omm_v2::OracleQuoterV2`;
  readonly $typeArgs: [];
  readonly $isPhantom = OracleQuoterV2.$isPhantom;

  readonly version: ToField<Version>;
  readonly oracleRegistryId: ToField<ID>;
  readonly oracleIndexA: ToField<"u64">;
  readonly oracleIndexB: ToField<"u64">;
  readonly decimalsA: ToField<"u8">;
  readonly decimalsB: ToField<"u8">;
  readonly amp: ToField<"u64">;

  private constructor(typeArgs: [], fields: OracleQuoterV2Fields) {
    this.$fullTypeName = composeSuiType(
      OracleQuoterV2.$typeName,
      ...typeArgs,
    ) as `${typeof ORACLE_V2_PKG_V1}::omm_v2::OracleQuoterV2`;
    this.$typeArgs = typeArgs;

    this.version = fields.version;
    this.oracleRegistryId = fields.oracleRegistryId;
    this.oracleIndexA = fields.oracleIndexA;
    this.oracleIndexB = fields.oracleIndexB;
    this.decimalsA = fields.decimalsA;
    this.decimalsB = fields.decimalsB;
    this.amp = fields.amp;
  }

  static reified(): OracleQuoterV2Reified {
    return {
      typeName: OracleQuoterV2.$typeName,
      fullTypeName: composeSuiType(
        OracleQuoterV2.$typeName,
        ...[],
      ) as `${typeof ORACLE_V2_PKG_V1}::omm_v2::OracleQuoterV2`,
      typeArgs: [] as [],
      isPhantom: OracleQuoterV2.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        OracleQuoterV2.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        OracleQuoterV2.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => OracleQuoterV2.fromBcs(data),
      bcs: OracleQuoterV2.bcs,
      fromJSONField: (field: any) => OracleQuoterV2.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => OracleQuoterV2.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        OracleQuoterV2.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        OracleQuoterV2.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        OracleQuoterV2.fetch(client, id),
      new: (fields: OracleQuoterV2Fields) => {
        return new OracleQuoterV2([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return OracleQuoterV2.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<OracleQuoterV2>> {
    return phantom(OracleQuoterV2.reified());
  }

  static get p() {
    return OracleQuoterV2.phantom();
  }

  static get bcs() {
    return bcs.struct("OracleQuoterV2", {
      version: Version.bcs,
      oracle_registry_id: ID.bcs,
      oracle_index_a: bcs.u64(),
      oracle_index_b: bcs.u64(),
      decimals_a: bcs.u8(),
      decimals_b: bcs.u8(),
      amp: bcs.u64(),
    });
  }

  static fromFields(fields: Record<string, any>): OracleQuoterV2 {
    return OracleQuoterV2.reified().new({
      version: decodeFromFields(Version.reified(), fields.version),
      oracleRegistryId: decodeFromFields(
        ID.reified(),
        fields.oracle_registry_id,
      ),
      oracleIndexA: decodeFromFields("u64", fields.oracle_index_a),
      oracleIndexB: decodeFromFields("u64", fields.oracle_index_b),
      decimalsA: decodeFromFields("u8", fields.decimals_a),
      decimalsB: decodeFromFields("u8", fields.decimals_b),
      amp: decodeFromFields("u64", fields.amp),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): OracleQuoterV2 {
    if (!isOracleQuoterV2(item.type)) {
      throw new Error("not a OracleQuoterV2 type");
    }

    return OracleQuoterV2.reified().new({
      version: decodeFromFieldsWithTypes(
        Version.reified(),
        item.fields.version,
      ),
      oracleRegistryId: decodeFromFields(
        ID.reified(),
        item.fields.oracle_registry_id,
      ),
      oracleIndexA: decodeFromFields("u64", item.fields.oracle_index_a),
      oracleIndexB: decodeFromFields("u64", item.fields.oracle_index_b),
      decimalsA: decodeFromFields("u8", item.fields.decimals_a),
      decimalsB: decodeFromFields("u8", item.fields.decimals_b),
      amp: decodeFromFields("u64", item.fields.amp),
    });
  }

  static fromBcs(data: Uint8Array): OracleQuoterV2 {
    return OracleQuoterV2.fromFields(OracleQuoterV2.bcs.parse(data));
  }

  toJSONField() {
    return {
      version: this.version.toJSONField(),
      oracleRegistryId: this.oracleRegistryId.toString(),
      oracleIndexA: this.oracleIndexA.toString(),
      oracleIndexB: this.oracleIndexB.toString(),
      decimalsA: this.decimalsA.toString(),
      decimalsB: this.decimalsB.toString(),
      amp: this.amp.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): OracleQuoterV2 {
    // {user: decodeFromJSONField("address", field.user), poolId: decodeFromJSONField(ID.reified(), field.poolId), depositA: decodeFromJSONField("u64", field.depositA), depositB: decodeFromJSONField("u64", field.depositB), mintLp: decodeFromJSONField("u64", field.mintLp), balanceA: decodeFromJSONField("u64", field.balanceA), balanceB: decodeFromJSONField("u64", field.balanceB)}
    return OracleQuoterV2.reified().new({
      version: decodeFromJSONField(Version.reified(), field.version),
      oracleRegistryId: decodeFromJSONField(
        ID.reified(),
        field.oracleRegistryId,
      ),
      oracleIndexA: decodeFromJSONField("u64", field.oracleIndexA),
      oracleIndexB: decodeFromJSONField("u64", field.oracleIndexB),
      decimalsA: decodeFromJSONField("u8", field.decimalsA),
      decimalsB: decodeFromJSONField("u8", field.decimalsB),
      amp: decodeFromJSONField("u64", field.amp),
    });
  }

  static fromJSON(json: Record<string, any>): OracleQuoterV2 {
    if (json.$typeName !== OracleQuoterV2.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return OracleQuoterV2.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): OracleQuoterV2 {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isOracleQuoterV2(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a OracleQuoterV2 object`,
      );
    }
    return OracleQuoterV2.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): OracleQuoterV2 {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isOracleQuoterV2(data.bcs.type)
      ) {
        throw new Error(`object at is not a OracleQuoterV2 object`);
      }

      return OracleQuoterV2.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return OracleQuoterV2.fromSuiParsedData(data.content);
    }

    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<OracleQuoterV2> {
    const res = await client.getObject({
      id,
      options: {
        showBcs: true,
      },
    });
    if (res.error) {
      throw new Error(
        `error fetching OracleQuoterV2 object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isOracleQuoterV2(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a OracleQuoterV2 object`);
    }

    return OracleQuoterV2.fromSuiObjectData(res.data);
  }
}
