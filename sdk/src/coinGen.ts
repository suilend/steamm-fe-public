import { bcs } from "@mysten/bcs";
import {
  update_constants,
  update_identifiers,
} from "@mysten/move-bytecode-template";
import init from "@mysten/move-bytecode-template";
import {
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";

// Initialize the WASM module
let initialized = false;
async function initializeWasm() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export async function createCoinBytecode(
  coin_type: string, // eg K_SUI
  module_name: string, // eg ksui
  symbol: string, // eg sSUI
  name: string, // eg Spring SUI
  description: string, // eg Spring SUI is a liquid staking protocol on Sui
  img_url: string,
) {
  await initializeWasm();

  const bytecode = Buffer.from(
    "oRzrCwYAAAAKAQAMAgweAyonBFEIBVlMB6UBywEI8AJgBtADXQqtBAUMsgQoABABCwIGAhECEgITAAICAAEBBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABDwUGAQACBwgJAQIDDAUBAQwDDQ0BAQwEDgoLAAUKAwQAAQQCBwQMAwICCAAHCAQAAQsCAQgAAQoCAQgFAQkAAQsBAQkAAQgABwkAAgoCCgIKAgsBAQgFBwgEAgsDAQkACwIBCQABBggEAQUBCwMBCAACCQAFDENvaW5NZXRhZGF0YQZPcHRpb24IVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcwZvcHRpb24TcHVibGljX3NoYXJlX29iamVjdA9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyBHNvbWUIdGVtcGxhdGUIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEIAQAAAAACEgsABwAHAQcCBwMHBBEGOAAKATgBDAILAS4RBTgCCwI4AwIA=",
    "base64",
  );

  let updated = update_identifiers(bytecode, {
    TEMPLATE: coin_type,
    template: module_name,
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
    bcs.string().serialize(img_url).toBytes(), // new value
    bcs.string().serialize("https://example.com/template.png").toBytes(), // current value
    "Vector(U8)", // type of the constant
  );

  return updated;
}

export function getTreasuryAndCoinMeta(
  publishTxResponse: SuiTransactionBlockResponse,
): [string, string, string] {
  // Step 2: Get the treasury Cap id from the transaction
  const treasuryCapObjectChange: SuiObjectChange | undefined =
    publishTxResponse.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("TreasuryCap"),
    );

  if (!treasuryCapObjectChange) {
    throw new Error("TreasuryCap object change not found");
  }

  if (treasuryCapObjectChange.type !== "created") {
    throw new Error("TreasuryCap object change is not of type 'created'");
  }

  const coinMetaObjectChange: SuiObjectChange | undefined =
    publishTxResponse.objectChanges?.find(
      (change) =>
        change.type === "created" && change.objectType.includes("CoinMetadata"),
    );

  if (!coinMetaObjectChange) {
    throw new Error("CoinMetadata object change not found");
  }

  if (coinMetaObjectChange.type !== "created") {
    throw new Error("CoinMetadata object change is not of type 'created'");
  }

  const coinMetadataId = coinMetaObjectChange.objectId;
  const treasuryId = treasuryCapObjectChange.objectId;
  const coinType = treasuryCapObjectChange.objectType
    .split("<")[1]
    .split(">")[0];

  return [treasuryId, coinMetadataId, coinType];
}
