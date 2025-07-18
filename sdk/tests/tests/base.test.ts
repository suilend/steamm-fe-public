/* eslint-disable */
import { ParsedKeypair, decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { beforeAll, describe, expect, it } from "bun:test";
import dotenv from "dotenv";

import { PoolManager } from "../../src/managers/pool";
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
import { testConfig } from "../utils/utils";

dotenv.config();

export async function test() {
  describe("test depost, swap and redeem", async () => {
    let keypair: Ed25519Keypair;
    let suiTreasuryCap: string;
    let usdcTreasuryCap: string;
    let sdk: SteammSDK;
    let pools: PoolInfo[];
    let pool: PoolInfo;
    let banks: BankList;

    beforeAll(async () => {
      const suiPrivateKey = process.env.TEMP_KEY;

      if (!suiPrivateKey) {
        throw new Error("TEMP_KEY is missing in the .env file");
      }

      // Create the keypair from the decoded private key
      const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
      keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

      // const sender = keypair.getPublicKey().toSuiAddress();
      // console.log("Wallet Address:", keypair.getPublicKey().toSuiAddress());
    });

    beforeAll(async () => {
      sdk = new SteammSDK(testConfig());
      pools = await sdk.fetchPoolData();
      banks = await sdk.fetchBankData();
      pool = (
        await sdk.fetchPoolData([
          `${STEAMM_PKG_ID}::usdc::USDC`,
          `${STEAMM_PKG_ID}::sui::SUI`,
        ])
      )[0];

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

    it("setup && listen to pool/bank creation events", async () => {
      const pools = await sdk.fetchPoolData();
      const banks = await sdk.fetchBankData();

      expect(pools.length).toBeGreaterThan(0);
      expect(Object.keys(banks).length).toBeGreaterThan(0);
    });

    it("Deposits liquidity", async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const poolManager = new PoolManager(sdk);
      const tx = new Transaction();

      const suiCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [
          tx.object(suiTreasuryCap),
          tx.pure.u64(BigInt("1000000000")),
        ],
      });

      const usdcCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [
          tx.object(usdcTreasuryCap),
          tx.pure.u64(BigInt("1000000000")),
        ],
      });

      //////////////////////////////////////////////////////////////

      await poolManager.depositLiquidityEntry(tx, {
        pool: pool.poolId,
        coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
        coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
        coinA: usdcCoin,
        coinB: suiCoin,
        maxA: BigInt("1000000000"),
        maxB: BigInt("1000000000"),
      });

      tx.transferObjects([suiCoin, usdcCoin], sdk.senderAddress);

      const devResult = await sdk.fullClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: sdk.senderAddress,
      });

      if (devResult.error) {
        console.log("DevResult failed.");
        throw new Error(devResult.error);
      }

      // Execute transaction

      const txResult = await sdk.fullClient.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      if (txResult.effects?.status?.status !== "success") {
        console.log("Transaction failed");
        throw new Error(
          `Transaction failed: ${JSON.stringify(txResult.effects)}`,
        );
      }
    });

    it("Swaps", async () => {
      const poolManager = new PoolManager(sdk);
      const tx = new Transaction();

      const suiCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [
          tx.object(suiTreasuryCap),
          tx.pure.u64(BigInt("1000000000")),
        ],
      });

      const usdcCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [
          tx.object(usdcTreasuryCap),
          tx.pure.u64(BigInt("1000000000")),
        ],
      });

      //////////////////////////////////////////////////////////////

      await poolManager.depositLiquidityEntry(tx, {
        pool: pool.poolId,
        coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
        coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
        coinA: usdcCoin,
        coinB: suiCoin,
        maxA: BigInt("1000000000"),
        maxB: BigInt("1000000000"),
      });

      //////////////////////////////////////////////////////////////

      const suiSwapCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [tx.object(suiTreasuryCap), tx.pure.u64(BigInt("10000"))],
      });

      const usdSwapCoin = tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [],
      });

      await poolManager.swap(tx, {
        pool: pool.poolId,
        coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
        coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
        coinA: usdSwapCoin,
        coinB: suiSwapCoin,
        a2b: false,
        amountIn: BigInt("10000"),
        minAmountOut: BigInt("0"),
      });

      tx.transferObjects(
        [suiSwapCoin, usdSwapCoin, suiCoin, usdcCoin],
        sdk.senderAddress,
      );

      const devResult = await sdk.fullClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: sdk.senderAddress,
      });

      if (devResult.error) {
        console.log("DevResult failed.");
        throw new Error(devResult.error);
      }

      // Execute transaction

      // await new Promise((resolve) => setTimeout(resolve, 1000));

      // const txResult = await sdk._rpcModule.signAndExecuteTransaction({
      //   transaction: tx,
      //   signer: keypair,
      //   options: {
      //     showEffects: true,
      //     showEvents: true,
      //   },
      // });

      // if (txResult.effects?.status?.status !== "success") {
      //   console.log("Transaction failed");
      //   throw new Error(
      //     `Transaction failed: ${JSON.stringify(txResult.effects)}`
      //   );
      // }
    });

    it("Redeems liquidity", async () => {
      const poolManager = new PoolManager(sdk);
      const tx = new Transaction();

      const suiCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [tx.object(suiTreasuryCap), tx.pure.u64(BigInt("1000000"))],
      });

      const usdcCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [tx.object(usdcTreasuryCap), tx.pure.u64(BigInt("1000000"))],
      });

      //////////////////////////////////////////////////////////////

      const [lpToken, _depositResult] = await poolManager.depositLiquidity(tx, {
        pool: pool.poolId,
        coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
        coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
        coinA: usdcCoin,
        coinB: suiCoin,
        maxA: BigInt("1000000"),
        maxB: BigInt("1000000"),
      });

      tx.transferObjects([suiCoin, usdcCoin], sdk.senderAddress);

      //////////////////////////////////////////////////////////////

      await poolManager.redeemLiquidityEntry(tx, {
        pool: pool.poolId,
        coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
        coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
        lpCoin: lpToken,
        minA: BigInt("0"),
        minB: BigInt("0"),
      });

      const devResult = await sdk.fullClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: sdk.senderAddress,
      });

      if (devResult.error) {
        console.log("DevResult failed.");
        console.log(devResult);
        throw new Error(devResult.error);
      }

      // Execute transaction

      // await new Promise((resolve) => setTimeout(resolve, 1000));

      // const txResult = await sdk._rpcModule.signAndExecuteTransaction({
      //   transaction: tx,
      //   signer: keypair,
      //   options: {
      //     showEffects: true,
      //     showEvents: true,
      //   },
      // });

      // if (txResult.effects?.status?.status !== "success") {
      //   console.log("Transaction failed");
      //   throw new Error(
      //     `Transaction failed: ${JSON.stringify(txResult.effects)}`
      //   );
      // }
    });
  });
}
