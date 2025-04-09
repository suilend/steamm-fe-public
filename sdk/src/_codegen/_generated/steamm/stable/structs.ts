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
import { STABLE_PKG_V1 } from "../index";
import { ID, UID } from "../../_dependencies/source/0x2/object/structs";
import { Version } from "../version/structs";
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== StableQuoter =============================== */

export function isStableQuoter(type: string): boolean {
  type = compressSuiType(type);
  return type === `${STABLE_PKG_V1}::stable::StableQuoter`;
}

export interface StableQuoterFields {
  version: ToField<Version>;
  oracleRegistryId: ToField<ID>;
  oracleIndexA: ToField<"u64">;
  oracleIndexB: ToField<"u64">;
  decimalsA: ToField<"u8">;
  decimalsB: ToField<"u8">;
  amp: ToField<"u64">;
}

export type StableQuoterReified = Reified<StableQuoter, StableQuoterFields>;

export class StableQuoter implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${STABLE_PKG_V1}::stable::StableQuoter`; 
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = StableQuoter.$typeName;
  readonly $fullTypeName: `${typeof STABLE_PKG_V1}::stable::StableQuoter`;
  readonly $typeArgs: [];
  readonly $isPhantom = StableQuoter.$isPhantom;

  readonly version: ToField<Version>;
  readonly oracleRegistryId: ToField<ID>;
  readonly oracleIndexA: ToField<"u64">;
  readonly oracleIndexB: ToField<"u64">;
  readonly decimalsA: ToField<"u8">;
  readonly decimalsB: ToField<"u8">;
  readonly amp: ToField<"u64">;

  private constructor(typeArgs: [], fields: StableQuoterFields) {
    this.$fullTypeName = composeSuiType(
      StableQuoter.$typeName,
      ...typeArgs,
    ) as `${typeof STABLE_PKG_V1}::stable::StableQuoter`;
    this.$typeArgs = typeArgs;

    this.version = fields.version;
    this.oracleRegistryId = fields.oracleRegistryId;
    this.oracleIndexA = fields.oracleIndexA;
    this.oracleIndexB = fields.oracleIndexB;
    this.decimalsA = fields.decimalsA;
    this.decimalsB = fields.decimalsB;
    this.amp = fields.amp;
  }

  static reified(): StableQuoterReified {
    return {
      typeName: StableQuoter.$typeName,
      fullTypeName: composeSuiType(
        StableQuoter.$typeName,
        ...[],
      ) as `${typeof STABLE_PKG_V1}::stable::StableQuoter`,
      typeArgs: [] as [],
      isPhantom: StableQuoter.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        StableQuoter.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        StableQuoter.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => StableQuoter.fromBcs(data),
      bcs: StableQuoter.bcs,
      fromJSONField: (field: any) => StableQuoter.fromJSONField(field),
      fromJSON: (json: Record<string, any>) => StableQuoter.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        StableQuoter.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        StableQuoter.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        StableQuoter.fetch(client, id),
      new: (fields: StableQuoterFields) => {
        return new StableQuoter([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return StableQuoter.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<StableQuoter>> {
    return phantom(StableQuoter.reified());
  }

  static get p() {
    return StableQuoter.phantom();
  }

  static get bcs() {
    return bcs.struct("StableQuoter", {
      version: Version.bcs,
      oracle_registry_id: ID.bcs,
      oracle_index_a: bcs.u64(),
      oracle_index_b: bcs.u64(),
      decimals_a: bcs.u8(),
      decimals_b: bcs.u8(),
      amp: bcs.u64(),
    });
  }

  static fromFields(fields: Record<string, any>): StableQuoter {
    return StableQuoter.reified().new({
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

  static fromFieldsWithTypes(item: FieldsWithTypes): StableQuoter {
    if (!isStableQuoter(item.type)) {
      throw new Error("not a StableQuoter type");
    }

    return StableQuoter.reified().new({
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

  static fromBcs(data: Uint8Array): StableQuoter {
    return StableQuoter.fromFields(StableQuoter.bcs.parse(data));
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

  static fromJSONField(field: any): StableQuoter {
    // {user: decodeFromJSONField("address", field.user), poolId: decodeFromJSONField(ID.reified(), field.poolId), depositA: decodeFromJSONField("u64", field.depositA), depositB: decodeFromJSONField("u64", field.depositB), mintLp: decodeFromJSONField("u64", field.mintLp), balanceA: decodeFromJSONField("u64", field.balanceA), balanceB: decodeFromJSONField("u64", field.balanceB)}
    return StableQuoter.reified().new({
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

  static fromJSON(json: Record<string, any>): StableQuoter {
    if (json.$typeName !== StableQuoter.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return StableQuoter.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): StableQuoter {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isStableQuoter(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a StableQuoter object`,
      );
    }
    return StableQuoter.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): StableQuoter {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isStableQuoter(data.bcs.type)
      ) {
        throw new Error(`object at is not a StableQuoter object`);
      }

      return StableQuoter.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return StableQuoter.fromSuiParsedData(data.content);
    }

    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(client: SuiClient, id: string): Promise<StableQuoter> {
    const res = await client.getObject({
      id,
      options: {
        showBcs: true,
      },
    });
    if (res.error) {
      throw new Error(
        `error fetching StableQuoter object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isStableQuoter(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a StableQuoter object`);
    }

    return StableQuoter.fromSuiObjectData(res.data);
  }
}
