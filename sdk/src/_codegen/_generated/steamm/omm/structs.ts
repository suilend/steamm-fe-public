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
import { PKG_V1 } from "../index";
import { ID, UID } from "../../_dependencies/source/0x2/object/structs";
import { Version } from "../version/structs";
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== OracleQuoter =============================== */

export function isOracleQuoter(type: string): boolean {
  type = compressSuiType(type);
  return type === `${PKG_V1}::omm::OracleQuoter`;
}

export interface OracleQuoterFields {
  version: ToField<Version>;
  oracleRegistryId: ToField<ID>;
  oracleIndexA: ToField<"u64">;
  oracleIndexB: ToField<"u64">;
  decimalsA: ToField<"u8">;
  decimalsB: ToField<"u8">;
}

export type OracleQuoterReified = Reified<OracleQuoter, OracleQuoterFields>;

export class OracleQuoter implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${PKG_V1}::omm::OracleQuoter`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = OracleQuoter.$typeName;
  readonly $fullTypeName: `${typeof PKG_V1}::omm::OracleQuoter`;
  readonly $typeArgs: [];
  readonly $isPhantom = OracleQuoter.$isPhantom;

  readonly version: ToField<Version>;
  readonly oracleRegistryId: ToField<ID>;
  readonly oracleIndexA: ToField<"u64">;
  readonly oracleIndexB: ToField<"u64">;
  readonly decimalsA: ToField<"u8">;
  readonly decimalsB: ToField<"u8">;

  private constructor(typeArgs: [], fields: OracleQuoterFields) {
    this.$fullTypeName = composeSuiType(
      OracleQuoter.$typeName,
      ...typeArgs,
    ) as `${typeof PKG_V1}::omm::OracleQuoter`;
    this.$typeArgs = typeArgs;

    this.version = fields.version;
    this.oracleRegistryId = fields.oracleRegistryId;
    this.oracleIndexA = fields.oracleIndexA;
    this.oracleIndexB = fields.oracleIndexB;
    this.decimalsA = fields.decimalsA;
    this.decimalsB = fields.decimalsB;
  }

  static reified(): OracleQuoterReified {
    return {
      typeName: OracleQuoter.$typeName,
      fullTypeName: composeSuiType(
        OracleQuoter.$typeName,
        ...[],
      ) as `${typeof PKG_V1}::omm::OracleQuoter`,
      typeArgs: [] as [],
      isPhantom: OracleQuoter.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        OracleQuoter.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        OracleQuoter.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => OracleQuoter.fromBcs(data),
      bcs: OracleQuoter.bcs,
      fromJSONField: (field: any) => OracleQuoter.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => OracleQuoter.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        OracleQuoter.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        OracleQuoter.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        OracleQuoter.fetch(client, id),
      new: (fields: OracleQuoterFields) => {
        return new OracleQuoter([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return OracleQuoter.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<OracleQuoter>> {
    return phantom(OracleQuoter.reified());
  }

  static get p() {
    return OracleQuoter.phantom();
  }

  static get bcs() {
    return bcs.struct("OracleQuoter", {
      version: Version.bcs,
      oracle_registry_id: ID.bcs,
      oracle_index_a: bcs.u64(),
      oracle_index_b: bcs.u64(),
      decimals_a: bcs.u8(),
      decimals_b: bcs.u8(),
    });
  }

  static fromFields(fields: Record<string, any>): OracleQuoter {
    return OracleQuoter.reified().new({
      version: decodeFromFields(Version.reified(), fields.version),
      oracleRegistryId: decodeFromFields(
        ID.reified(),
        fields.oracle_registry_id,
      ),
      oracleIndexA: decodeFromFields("u64", fields.oracle_index_a),
      oracleIndexB: decodeFromFields("u64", fields.oracle_index_b),
      decimalsA: decodeFromFields("u8", fields.decimals_a),
      decimalsB: decodeFromFields("u8", fields.decimals_b),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): OracleQuoter {
    if (!isOracleQuoter(item.type)) {
      throw new Error("not a OracleQuoter type");
    }

    return OracleQuoter.reified().new({
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
    });
  }

  static fromBcs(data: Uint8Array): OracleQuoter {
    return OracleQuoter.fromFields(OracleQuoter.bcs.parse(data));
  }

  toJSONField() {
    return {
      version: this.version.toJSONField(),
      oracleRegistryId: this.oracleRegistryId.toString(),
      oracleIndexA: this.oracleIndexA.toString(),
      oracleIndexB: this.oracleIndexB.toString(),
      decimalsA: this.decimalsA.toString(),
      decimalsB: this.decimalsB.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): OracleQuoter {
    // {user: decodeFromJSONField("address", field.user), poolId: decodeFromJSONField(ID.reified(), field.poolId), depositA: decodeFromJSONField("u64", field.depositA), depositB: decodeFromJSONField("u64", field.depositB), mintLp: decodeFromJSONField("u64", field.mintLp), balanceA: decodeFromJSONField("u64", field.balanceA), balanceB: decodeFromJSONField("u64", field.balanceB)}
    return OracleQuoter.reified().new({
      version: decodeFromJSONField(Version.reified(), field.version),
      oracleRegistryId: decodeFromJSONField(
        ID.reified(),
        field.oracleRegistryId,
      ),
      oracleIndexA: decodeFromJSONField("u64", field.oracleIndexA),
      oracleIndexB: decodeFromJSONField("u64", field.oracleIndexB),
      decimalsA: decodeFromJSONField("u8", field.decimalsA),
      decimalsB: decodeFromJSONField("u8", field.decimalsB),
    });
  }

  static fromJSON(json: Record<string, any>): OracleQuoter {
    if (json.$typeName !== OracleQuoter.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return OracleQuoter.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): OracleQuoter {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isOracleQuoter(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a OracleQuoter object`,
      );
    }
    return OracleQuoter.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): OracleQuoter {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isOracleQuoter(data.bcs.type)
      ) {
        throw new Error(`object at is not a OracleQuoter object`);
      }

      return OracleQuoter.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return OracleQuoter.fromSuiParsedData(data.content);
    }

    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<OracleQuoter> {
    const res = await client.getObject({
      id,
      options: {
        showBcs: true,
      },
    });
    if (res.error) {
      throw new Error(
        `error fetching OracleQuoter object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isOracleQuoter(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a OracleQuoter object`);
    }

    return OracleQuoter.fromSuiObjectData(res.data);
  }
}
