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

import { STEAMM_PKG_ID } from "./../packages";
import { PaginatedObjectsResponse, SuiObjectData } from "@mysten/sui/client";
import { PoolManager } from "../../src";
import {
  createCoinAndBankHelper,
  createOraclePoolHelper,
  createPoolHelper,
  mintCoin,
  testConfig,
} from "../utils/utils";

dotenv.config();

export async function test() {
  describe("test oracle V1 swap", async () => {
    let keypair: Ed25519Keypair;
    let suiTreasuryCap: string;
    let usdcTreasuryCap: string;
    let sdk: SteammSDK;
    let pools: PoolInfo[];
    let banks: BankList;

    beforeEach((): void => {
      // jest.setTimeout(60000);
      setDefaultTimeout(60000);

      sdk.testConfig = { mockOracleObjs: {} };
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

    it("Oracle quoter", async () => {
      const coinAData = await createCoinAndBankHelper(sdk, "A");
      const coinBData = await createCoinAndBankHelper(sdk, "B");

      const lpAB = await createOraclePoolHelper(sdk, coinAData, coinBData);

      console.log(
        "pools: ",
        await sdk.fetchPoolData([coinAData.coinType, coinBData.coinType]),
      );

      const poolAB = (
        await sdk.fetchPoolData([coinAData.coinType, coinBData.coinType])
      )[0];

      const depositTx = new Transaction();

      const coinA = mintCoin(depositTx, coinAData.coinType, coinAData.treasury);
      const coinB = mintCoin(depositTx, coinBData.coinType, coinBData.treasury);

      await sdk.Pool.depositLiquidityEntry(depositTx, {
        pool: poolAB.poolId,
        coinA: coinA,
        coinB: coinB,
        coinTypeA: coinAData.coinType,
        coinTypeB: coinBData.coinType,
        maxA: BigInt("10000000"),
        maxB: BigInt("10000000"),
      });

      depositTx.transferObjects([coinA, coinB], sdk.senderAddress);

      await sdk.fullClient.signAndExecuteTransaction({
        transaction: depositTx,
        signer: keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const swapTx = new Transaction();

      const coinIn = mintCoin(
        swapTx,
        coinAData.coinType,
        coinAData.treasury,
        "10000",
      );
      const coinOut = mintCoin(
        swapTx,
        coinBData.coinType,
        coinBData.treasury,
        "0",
      );

      await sdk.refreshPoolCache();
      const poolManager = new PoolManager(sdk);

      await poolManager.swap(swapTx, {
        pool: poolAB.poolId,
        coinTypeA: coinAData.coinType,
        coinTypeB: coinBData.coinType,
        coinA: coinIn,
        coinB: coinOut,
        a2b: false,
        amountIn: BigInt("10000"),
        minAmountOut: BigInt("0"),
      });

      swapTx.transferObjects([coinA, coinB], sdk.senderAddress);

      await sdk.fullClient.signAndExecuteTransaction({
        transaction: swapTx,
        signer: keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
    });
  });
}
