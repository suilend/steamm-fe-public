/* eslint-disable */
import {
  ParsedKeypair,
  decodeSuiPrivateKey,
  encodeSuiPrivateKey,
} from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import {
  beforeAll,
  describe,
  beforeEach,
  expect,
  it,
  setDefaultTimeout,
} from "bun:test";
import dotenv from "dotenv";

import { PoolModule } from "../src/modules/poolModule";
import { RpcModule } from "../src/modules/rpcModule";
import { SteammSDK } from "../src/sdk";
import { BankList, DataPage, PoolInfo } from "../src/types";
import { BankInfo } from "../src/types";

import {
  GLOBAL_ADMIN_ID,
  LENDING_MARKET_ID,
  LENDING_MARKET_TYPE,
  REGISTRY_ID,
  STEAMM_PKG_ID,
  STEAMM_SCRIPT_PKG_ID,
  SUILEND_PKG_ID,
} from "./packages";
import {
  createBTokenHelper,
  createCoinAndBankHelper,
  createCoinHelper,
  createCoinTx,
  createPoolHelper,
  mintCoin,
} from "./utils";
import { getTreasuryAndCoinMeta } from "../src/coinGen";
import {
  PaginatedObjectsResponse,
  SuiObjectData,
  SuiObjectResponse,
} from "@mysten/sui/client";
import { parseErrorCode, parseMoveAbortError, Pool } from "../src";

dotenv.config();

export function test() {
  describe("test depost, swap and redeem", () => {
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
      sdk = new SteammSDK({
        fullRpcUrl: "http://127.0.0.1:9000",
        steamm_config: {
          package_id: STEAMM_PKG_ID,
          published_at: STEAMM_PKG_ID,
          config: {
            registryId: REGISTRY_ID,
            globalAdmin: GLOBAL_ADMIN_ID,
          },
        },
        suilend_config: {
          package_id: SUILEND_PKG_ID,
          published_at: SUILEND_PKG_ID,
          config: {
            lendingMarketId: LENDING_MARKET_ID,
            lendingMarketType: LENDING_MARKET_TYPE,
          },
        },
        steamm_script_config: {
          package_id: STEAMM_SCRIPT_PKG_ID,
          published_at: STEAMM_SCRIPT_PKG_ID,
        },
      });
      pools = await sdk.getPools();
      banks = await sdk.getBanks();

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
    });

    it("Swap router", async () => {
      const coinAData = await createCoinAndBankHelper(sdk, "A");
      const coinBData = await createCoinAndBankHelper(sdk, "B");
      const coinCData = await createCoinAndBankHelper(sdk, "C");
      // const coinDData = await createCoinAndBankHelper(sdk, "D");
      // const coinEData = await createCoinAndBankHelper(sdk, "E");
      // const coinFData = await createCoinAndBankHelper(sdk, "F");

      // get banks
      const banks = await sdk.getBanks();
      const bankA = banks[coinAData.coinType];
      const bankB = banks[coinBData.coinType];
      const bankC = banks[coinCData.coinType];
      // const bankD = banks[coinDData.coinType];
      // const bankE = banks[coinEData.coinType];
      // const bankF = banks[coinFData.coinType];

      const lpAB = await createPoolHelper(sdk, coinAData, coinBData);
      const lpBC = await createPoolHelper(sdk, coinBData, coinCData);
      // const lpAD = await createPoolHelper(sdk, coinAData, coinDData);
      // const lpAE = await createPoolHelper(sdk, coinAData, coinEData);

      // const lpDB = await createPoolHelper(sdk, coinDData, coinBData);
      // const lpDF = await createPoolHelper(sdk, coinDData, coinFData);
      // const lpEF = await createPoolHelper(sdk, coinEData, coinFData);

      // const lpFE = await createPoolHelper(sdk, coinFData, coinCData);

      // Seed the pools with liquidity
      const pools = await sdk.getPools();

      const poolAB = (
        await sdk.getPools([coinAData.coinType, coinBData.coinType])
      )[0];

      const poolBC = (
        await sdk.getPools([coinBData.coinType, coinCData.coinType])
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
