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
import { SCRIPT_PKG_V1 } from "../index";
import { bcs } from "@mysten/sui/bcs";
import { SuiClient, SuiObjectData, SuiParsedData } from "@mysten/sui/client";
import { fromB64 } from "@mysten/sui/utils";

/* ============================== MultiRouteSwapQuote =============================== */

export function isMultiRouteSwapQuote(type: string): boolean {
  type = compressSuiType(type);
  return type === `${SCRIPT_PKG_V1}::pool_script::MultiRouteSwapQuote`;
}

export interface MultiRouteSwapQuoteFields {
  amountIn: ToField<"u64">;
  amountOut: ToField<"u64">;
}

export type MultiRouteSwapQuoteReified = Reified<
  MultiRouteSwapQuote,
  MultiRouteSwapQuoteFields
>;

export class MultiRouteSwapQuote implements StructClass {
  __StructClass = true as const;

  static readonly $typeName = `${SCRIPT_PKG_V1}::pool_script::MultiRouteSwapQuote`;
  static readonly $numTypeParams = 0;
  static readonly $isPhantom = [] as const;

  readonly $typeName = MultiRouteSwapQuote.$typeName;
  readonly $fullTypeName: `${typeof SCRIPT_PKG_V1}::pool_script::MultiRouteSwapQuote`;
  readonly $typeArgs: [];
  readonly $isPhantom = MultiRouteSwapQuote.$isPhantom;

  readonly amountIn: ToField<"u64">;
  readonly amountOut: ToField<"u64">;

  private constructor(typeArgs: [], fields: MultiRouteSwapQuoteFields) {
    this.$fullTypeName = composeSuiType(
      MultiRouteSwapQuote.$typeName,
      ...typeArgs,
    ) as `${typeof SCRIPT_PKG_V1}::pool_script::MultiRouteSwapQuote`;
    this.$typeArgs = typeArgs;

    this.amountIn = fields.amountIn;
    this.amountOut = fields.amountOut;
  }

  static reified(): MultiRouteSwapQuoteReified {
    return {
      typeName: MultiRouteSwapQuote.$typeName,
      fullTypeName: composeSuiType(
        MultiRouteSwapQuote.$typeName,
        ...[],
      ) as `${typeof SCRIPT_PKG_V1}::pool_script::MultiRouteSwapQuote`,
      typeArgs: [] as [],
      isPhantom: MultiRouteSwapQuote.$isPhantom,
      reifiedTypeArgs: [],
      fromFields: (fields: Record<string, any>) =>
        MultiRouteSwapQuote.fromFields(fields),
      fromFieldsWithTypes: (item: FieldsWithTypes) =>
        MultiRouteSwapQuote.fromFieldsWithTypes(item),
      fromBcs: (data: Uint8Array) => MultiRouteSwapQuote.fromBcs(data),
      bcs: MultiRouteSwapQuote.bcs,
      fromJSONField: (field: any) => MultiRouteSwapQuote.fromJSONField(field),
      fromJSON: (json: Record<string, any>) =>
        MultiRouteSwapQuote.fromJSON(json),
      fromSuiParsedData: (content: SuiParsedData) =>
        MultiRouteSwapQuote.fromSuiParsedData(content),
      fromSuiObjectData: (content: SuiObjectData) =>
        MultiRouteSwapQuote.fromSuiObjectData(content),
      fetch: async (client: SuiClient, id: string) =>
        MultiRouteSwapQuote.fetch(client, id),
      new: (fields: MultiRouteSwapQuoteFields) => {
        return new MultiRouteSwapQuote([], fields);
      },
      kind: "StructClassReified",
    };
  }

  static get r() {
    return MultiRouteSwapQuote.reified();
  }

  static phantom(): PhantomReified<ToTypeStr<MultiRouteSwapQuote>> {
    return phantom(MultiRouteSwapQuote.reified());
  }

  static get p() {
    return MultiRouteSwapQuote.phantom();
  }

  static get bcs() {
    return bcs.struct("MultiRouteSwapQuote", {
      amount_in: bcs.u64(),
      amount_out: bcs.u64(),
    });
  }

  static fromFields(fields: Record<string, any>): MultiRouteSwapQuote {
    return MultiRouteSwapQuote.reified().new({
      amountIn: decodeFromFields("u64", fields.amount_in),
      amountOut: decodeFromFields("u64", fields.amount_out),
    });
  }

  static fromFieldsWithTypes(item: FieldsWithTypes): MultiRouteSwapQuote {
    if (!isMultiRouteSwapQuote(item.type)) {
      throw new Error("not a MultiRouteSwapQuote type");
    }

    return MultiRouteSwapQuote.reified().new({
      amountIn: decodeFromFieldsWithTypes("u64", item.fields.amount_in),
      amountOut: decodeFromFieldsWithTypes("u64", item.fields.amount_out),
    });
  }

  static fromBcs(data: Uint8Array): MultiRouteSwapQuote {
    return MultiRouteSwapQuote.fromFields(MultiRouteSwapQuote.bcs.parse(data));
  }

  toJSONField() {
    return {
      amountIn: this.amountIn.toString(),
      amountOut: this.amountOut.toString(),
    };
  }

  toJSON() {
    return {
      $typeName: this.$typeName,
      $typeArgs: this.$typeArgs,
      ...this.toJSONField(),
    };
  }

  static fromJSONField(field: any): MultiRouteSwapQuote {
    return MultiRouteSwapQuote.reified().new({
      amountIn: decodeFromJSONField("u64", field.amountIn),
      amountOut: decodeFromJSONField("u64", field.amountOut),
    });
  }

  static fromJSON(json: Record<string, any>): MultiRouteSwapQuote {
    if (json.$typeName !== MultiRouteSwapQuote.$typeName) {
      throw new Error("not a WithTwoGenerics json object");
    }

    return MultiRouteSwapQuote.fromJSONField(json);
  }

  static fromSuiParsedData(content: SuiParsedData): MultiRouteSwapQuote {
    if (content.dataType !== "moveObject") {
      throw new Error("not an object");
    }
    if (!isMultiRouteSwapQuote(content.type)) {
      throw new Error(
        `object at ${(content.fields as any).id} is not a MultiRouteSwapQuote object`,
      );
    }
    return MultiRouteSwapQuote.fromFieldsWithTypes(content);
  }

  static fromSuiObjectData(data: SuiObjectData): MultiRouteSwapQuote {
    if (data.bcs) {
      if (
        data.bcs.dataType !== "moveObject" ||
        !isMultiRouteSwapQuote(data.bcs.type)
      ) {
        throw new Error(`object at is not a MultiRouteSwapQuote object`);
      }

      return MultiRouteSwapQuote.fromBcs(fromB64(data.bcs.bcsBytes));
    }
    if (data.content) {
      return MultiRouteSwapQuote.fromSuiParsedData(data.content);
    }

    throw new Error(
      "Both `bcs` and `content` fields are missing from the data. Include `showBcs` or `showContent` in the request.",
    );
  }

  static async fetch(
    client: SuiClient,
    id: string,
  ): Promise<MultiRouteSwapQuote> {
    const res = await client.getObject({
      id,
      options: {
        showBcs: true,
      },
    });
    if (res.error) {
      throw new Error(
        `error fetching MultiRouteSwapQuote object at id ${id}: ${res.error.code}`,
      );
    }
    if (
      res.data?.bcs?.dataType !== "moveObject" ||
      !isMultiRouteSwapQuote(res.data.bcs.type)
    ) {
      throw new Error(`object at id ${id} is not a MultiRouteSwapQuote object`);
    }

    return MultiRouteSwapQuote.fromSuiObjectData(res.data);
  }
}
