/* eslint-disable */
import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import {
  beforeAll,
  describe,
  beforeEach,
  it,
  setDefaultTimeout,
} from "bun:test";
import dotenv from "dotenv";
import { SteammSDK } from "../../src/sdk";
import { BankList, DataPage, PoolInfo } from "../../src/types";

import {
  GLOBAL_ADMIN_ID,
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  REGISTRY_ID,
  STEAMM_PKG_ID,
  STEAMM_SCRIPT_PKG_ID,
  SUILEND_PKG_ID,
} from "./../packages";
import { PaginatedObjectsResponse, SuiObjectData } from "@mysten/sui/client";
import { parseErrorCode } from "../../src";
import {
  createCoinAndBankHelper,
  createPoolHelper,
  mintCoin,
  testConfig,
} from "../utils/utils";

dotenv.config();

export async function test() {
  describe("test swap router", async () => {
    let keypair: Ed25519Keypair;
    let suiTreasuryCap: string;
    let usdcTreasuryCap: string;
    let sdk: SteammSDK;
    let pools: PoolInfo[];
    let banks: BankList;

    beforeEach((): void => {
      // jest.setTimeout(60000);
      setDefaultTimeout(60000);
    });

    beforeAll(async () => {
      const suiPrivateKey = process.env.TEMP_KEY;

      if (!suiPrivateKey) {
        throw new Error("TEMP_KEY is missing in the .env file");
      }

      // Create the keypair from the decoded private key
      const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
      keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);
    });

    beforeAll(async () => {
      sdk = new SteammSDK(testConfig());
      pools = await sdk.fetchPoolData();
      banks = await sdk.fetchBankData();

      sdk.signer = keypair;

      const ownedPagedObjs: DataPage<PaginatedObjectsResponse[]> =
        await sdk.fullClient.getOwnedObjectsByPage(sdk.senderAddress, {
          options: {
            showType: true,
          },
        });

      const ownedObjs = ownedPagedObjs.data
        .flatMap((pages) => pages)
        .flatMap((pages) => pages.data) as SuiObjectData[];

      suiTreasuryCap = ownedObjs.find(
        (obj) =>
          obj.type === `0x2::coin::TreasuryCap<${STEAMM_PKG_ID}::sui::SUI>`,
      )!.objectId!;

      usdcTreasuryCap = ownedObjs.find(
        (obj) =>
          obj.type === `0x2::coin::TreasuryCap<${STEAMM_PKG_ID}::usdc::USDC>`,
      )!.objectId!;

      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    it("Swap router", async () => {
      const coinAData = await createCoinAndBankHelper(sdk, "A");
      const coinBData = await createCoinAndBankHelper(sdk, "B");
      const coinCData = await createCoinAndBankHelper(sdk, "C");

      // get banks
      const banks = await sdk.fetchBankData();
      const bankA = banks[coinAData.coinType];
      const bankB = banks[coinBData.coinType];
      const bankC = banks[coinCData.coinType];

      const lpAB = await createPoolHelper(sdk, coinAData, coinBData);
      const lpBC = await createPoolHelper(sdk, coinBData, coinCData);

      // Seed the pools with liquidity
      const pools = await sdk.fetchPoolData();

      const poolAB = (
        await sdk.fetchPoolData([coinAData.coinType, coinBData.coinType])
      )[0];

      const poolBC = (
        await sdk.fetchPoolData([coinBData.coinType, coinCData.coinType])
      )[0];

      const depositTx = new Transaction();

      const coinA = mintCoin(depositTx, coinAData.coinType, coinAData.treasury);
      const coinB = mintCoin(depositTx, coinBData.coinType, coinBData.treasury);
      const coinC = mintCoin(depositTx, coinCData.coinType, coinCData.treasury);

      await sdk.Pool.depositLiquidityEntry(depositTx, {
        pool: poolAB.poolId,
        coinA: coinA,
        coinB: coinB,
        coinTypeA: coinAData.coinType,
        coinTypeB: coinBData.coinType,
        maxA: BigInt("10000000"),
        maxB: BigInt("10000000"),
      });

      await sdk.Pool.depositLiquidityEntry(depositTx, {
        pool: poolBC.poolId,
        coinA: coinB,
        coinB: coinC,
        coinTypeA: coinBData.coinType,
        coinTypeB: coinCData.coinType,
        maxA: BigInt("10000000"),
        maxB: BigInt("10000000"),
      });

      depositTx.transferObjects([coinA, coinB, coinC], sdk.senderAddress);

      const txResult = await sdk.fullClient.signAndExecuteTransaction({
        transaction: depositTx,
        signer: keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const { route, quote } = await sdk.Router.getBestSwapRoute(
        {
          coinIn: coinAData.coinType,
          coinOut: coinCData.coinType,
        },
        BigInt("50000"),
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const swapTx = new Transaction();
      const coinIn = mintCoin(swapTx, coinAData.coinType, coinAData.treasury);

      await sdk.Router.swapWithRoute(swapTx, {
        coinIn: coinIn,
        route,
        quote,
      });

      swapTx.transferObjects([coinIn], sdk.senderAddress);

      // Dry run the transaction first
      const devResult = await sdk.fullClient.devInspectTransactionBlock({
        transactionBlock: swapTx,
        sender: sdk.senderAddress,
        additionalArgs: { showRawTxnDataAndEffects: true },
      });

      // Check if dry run was successful
      if (devResult.effects.status.status !== "success") {
        const parsedError = parseErrorCode(devResult);
        throw new Error(`Dry run failed: ${JSON.stringify(parsedError)}`);
      }

      // const swapTxResult = await sdk.fullClient.signAndExecuteTransaction({
      //   transaction: swapTx,
      //   signer: keypair,
      //   options: {
      //     showEffects: true,
      //     showEvents: true,
      //   },
      // });
    });
  });
}
