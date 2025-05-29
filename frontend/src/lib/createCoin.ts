import init, {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import { bcs } from "@mysten/sui/bcs";
import {
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { WalletContext } from "@suilend/sui-fe-next";

import { LAUNCH_TOKEN_PACKAGE_ID } from "@/lib/launchToken";

export const generate_bytecode = (
  module: string,
  type: string,
  name: string,
  symbol: string,
  description: string,
  iconUrl: string,
  decimals?: number,
  options?: { isLaunchToken?: boolean },
): Uint8Array<ArrayBufferLike> => {
  console.log("[generate_bytecode] Generating bytecode", {
    module,
    type,
    name,
    symbol,
    description,
    iconUrl,
    decimals,
  });

  const bytecode = Buffer.from(
    !options?.isLaunchToken
      ? "oRzrCwYAAAAKAQAMAgweAyonBFEIBVlMB6UBywEI8AJgBtADXQqtBAUMsgQoABABCwIGAhECEgITAAICAAEBBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABDwUGAQACBwgJAQIDDAUBAQwDDQ0BAQwEDgoLAAUKAwQAAQQCBwQMAwICCAAHCAQAAQsCAQgAAQoCAQgFAQkAAQsBAQkAAQgABwkAAgoCCgIKAgsBAQgFBwgEAgsDAQkACwIBCQABBggEAQUBCwMBCAACCQAFDENvaW5NZXRhZGF0YQZPcHRpb24IVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcwZvcHRpb24TcHVibGljX3NoYXJlX29iamVjdA9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyBHNvbWUIdGVtcGxhdGUIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEIAQAAAAACEgsABwAHAQcCBwMHBBEGOAAKATgBDAILAS4RBTgCCwI4AwIA="
      : "oRzrCwYAAAAKAQAMAgwYAyQbBD8GBUVAB4UBsgEItwJgBpcDXQr0AwUM+QMrAAwBBQEOAQ8BEAINAAECAAEADAEAAQECDAEAAQMDAgAEBAcAAAgAAQACCgsBAQwDCwgJAAQJAwQABQYGBwECBAUBCgECAggABwgDAAELAQEIAAEKAgEIBAEIAAcJAAIKAgoCCgIIBAcIAwILAgEJAAsBAQkAAQYIAwEFAQsCAQgAAgkABQxDb2luTWV0YWRhdGEIVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcw9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyCHRlbXBsYXRlDXRva2VuX2VtaXR0ZXIIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC9AVLTJZ+pkFzRT9ZOg7JjLaqNRY1y8QS9P31+AS7mNsCAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEHAQAAAAACFAsABwAHAQcCBwMHBBEDCgE4AAwCCgEuEQI4AQsCCwEuEQI4AgIA",
    "base64",
  );

  let updated = update_identifiers(bytecode, {
    TEMPLATE: type,
    template: module,
  });

  updated = update_constants(
    updated,
    bcs.string().serialize(symbol).toBytes(),
    bcs.string().serialize("TMPL").toBytes(),
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(name).toBytes(), // new value
    bcs.string().serialize("Template Coin").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(description).toBytes(), // new value
    bcs.string().serialize("Template Coin Description").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    bcs.string().serialize(iconUrl).toBytes(), // new value
    bcs.string().serialize("https://example.com/template.png").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  updated = update_constants(
    updated,
    new Uint8Array([decimals ?? 9]), // new value
    new Uint8Array([9]), // current value
    "U8",
  );

  return updated;
};

export const initializeCoinCreation = async () => {
  await init();
};

export type CreateCoinResult = {
  res: SuiTransactionBlockResponse;
  upgradeCapId: string;
  treasuryCapId: string;
  coinType: string;
  coinMetadataId: string;
};
export const createCoin = async (
  bytecode: Uint8Array<ArrayBufferLike>,
  address: string,
  signExecuteAndWaitForTransaction: WalletContext["signExecuteAndWaitForTransaction"],
  options?: { isLaunchToken?: boolean },
): Promise<CreateCoinResult> => {
  console.log("[createCoin] Creating coin");

  const transaction = new Transaction();

  const [upgradeCap] = transaction.publish({
    modules: [[...bytecode]],
    dependencies: !options?.isLaunchToken
      ? [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")]
      : [
          normalizeSuiAddress("0x1"),
          normalizeSuiAddress("0x2"),
          normalizeSuiAddress(LAUNCH_TOKEN_PACKAGE_ID),
        ],
  });
  transaction.transferObjects([upgradeCap], transaction.pure.address(address));

  const res = await signExecuteAndWaitForTransaction(transaction);

  // Get UpgradeCap id from transaction
  const upgradeCapChange: SuiObjectChange | undefined = res.objectChanges?.find(
    (change) =>
      change.type === "created" && change.objectType.includes("UpgradeCap"),
  );
  if (!upgradeCapChange) throw new Error("UpgradeCap object change not found");
  if (upgradeCapChange.type !== "created")
    throw new Error("UpgradeCap object change is not of type 'created'");

  // Get TreasuryCap id from transaction
  const treasuryCapObjectChange: SuiObjectChange | undefined =
    res.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("TreasuryCap"),
    );
  if (!treasuryCapObjectChange)
    throw new Error("TreasuryCap object change not found");
  if (treasuryCapObjectChange.type !== "created")
    throw new Error("TreasuryCap object change is not of type 'created'");

  // Get CoinMetadata id from transaction
  const coinMetaObjectChange: SuiObjectChange | undefined =
    res.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("CoinMetadata"),
    );
  if (!coinMetaObjectChange)
    throw new Error("CoinMetadata object change not found");
  if (coinMetaObjectChange.type !== "created")
    throw new Error("CoinMetadata object change is not of type 'created'");

  const upgradeCapId = upgradeCapChange.objectId;
  const treasuryCapId = treasuryCapObjectChange.objectId;
  const coinType = treasuryCapObjectChange.objectType
    .split("<")[1]
    .split(">")[0];
  const coinMetadataId = coinMetaObjectChange.objectId;

  console.log(
    "coinType:",
    coinType,
    "upgradeCapId:",
    upgradeCapId,
    "treasuryCapId:",
    treasuryCapId,
    "coinMetadataId:",
    coinMetadataId,
  );

  return { res, upgradeCapId, treasuryCapId, coinType, coinMetadataId };
};
