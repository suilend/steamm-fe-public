import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  decodeSuiPrivateKey,
  encodeSuiPrivateKey,
  ParsedKeypair,
} from "@mysten/sui/cryptography";
import { SteammSDK } from "../src/sdk";
import { STEAMM_PKG_ID, SUILEND_PKG_ID } from "./packages";
import { describe, it, expect, beforeAll } from "bun:test";
import { PoolModule } from "../src/modules/poolModule";
import { Transaction } from "@mysten/sui/transactions";
import { RpcModule } from "../src/modules/rpcModule";
import dotenv from "dotenv";
import { BankList, PoolInfo } from "../src/types";
import { BankInfo } from "../src/types";

dotenv.config();

// const suiPrivateKey = process.env.PRIVATE_KEY;

// if (!suiPrivateKey) {
//   throw new Error("PRIVATE_KEY is missing in the .env file");
// }

export function test() {
  describe("describe", () => {
    let keypair: Ed25519Keypair;
    let suiTreasuryCap: string;
    let usdcTreasuryCap: string;
    let sdk: SteammSDK;
    let pools: PoolInfo[];
    let banks: BankList;

    beforeAll(async () => {
      const suiPrivateKey = process.env.PRIVATE_KEY;

      if (!suiPrivateKey) {
        throw new Error("PRIVATE_KEY is missing in the .env file");
      }

      // Create the keypair from the decoded private key
      const decodedKey: ParsedKeypair = decodeSuiPrivateKey(suiPrivateKey);
      keypair = Ed25519Keypair.fromSecretKey(decodedKey.secretKey);

      // const sender = keypair.getPublicKey().toSuiAddress();
      // console.log("Wallet Address:", keypair.getPublicKey().toSuiAddress());
    });

    beforeAll(async () => {
      sdk = new SteammSDK({
        fullRpcUrl: "http://127.0.0.1:9000",
        steamm_config: {
          package_id: STEAMM_PKG_ID,
          published_at: STEAMM_PKG_ID,
        },
        suilend_config: {
          package_id: SUILEND_PKG_ID,
          published_at: SUILEND_PKG_ID,
        },
      });
      pools = await sdk.getPools();
      banks = await sdk.getBanks();

      sdk.signer = keypair;

      const ownedObjs = await sdk.fullClient.getOwnedObjects({
        owner: sdk.senderAddress,
        options: {
          showType: true,
        },
      });

      suiTreasuryCap = ownedObjs.data.find(
        (obj) =>
          obj.data?.type ===
          `0x2::coin::TreasuryCap<${STEAMM_PKG_ID}::sui::SUI>`
      )!.data?.objectId!;

      usdcTreasuryCap = ownedObjs.data.find(
        (obj) =>
          obj.data?.type ===
          `0x2::coin::TreasuryCap<${STEAMM_PKG_ID}::usdc::USDC>`
      )!.data?.objectId!;
    });

    // beforeEach(async () => {});

    // afterAll(async () => {});

    it("setup && listen to pool/bank creation events", async () => {
      const pools = await sdk.getPools();
      const banks = await sdk.getBanks();

      expect(pools.length).toBeGreaterThan(0);
      expect(Object.keys(banks).length).toBeGreaterThan(0);
    });

    it("Deposits liquidity", async () => {
      const poolModule = new PoolModule(sdk);
      const tx = new Transaction();

      const suiCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [
          tx.object(suiTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      const usdcCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [
          tx.object(usdcTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      //////////////////////////////////////////////////////////////

      await poolModule.depositLiquidityEntry(
        {
          pool: pools[0].poolId,
          coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
          coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
          coinObjA: usdcCoin,
          coinObjB: suiCoin,
          maxA: BigInt("1000000000000000000"),
          maxB: BigInt("1000000000000000000"),
        },
        tx
      );

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

    it("Swaps", async () => {
      const poolModule = new PoolModule(sdk);
      const tx = new Transaction();

      const suiCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [
          tx.object(suiTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      const usdcCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [
          tx.object(usdcTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      //////////////////////////////////////////////////////////////

      await poolModule.depositLiquidityEntry(
        {
          pool: pools[0].poolId,
          coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
          coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
          coinObjA: usdcCoin,
          coinObjB: suiCoin,
          maxA: BigInt("1000000000000000000"),
          maxB: BigInt("1000000000000000000"),
        },
        tx
      );

      //////////////////////////////////////////////////////////////

      const suiSwapCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [
          tx.object(suiTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      const usdSwapCoin = tx.moveCall({
        target: "0x2::coin::zero",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [],
      });

      await poolModule.swapEntry(
        {
          pool: pools[0].poolId,
          coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
          coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
          coinAObj: usdSwapCoin,
          coinBObj: suiSwapCoin,
          a2b: false,
          amountIn: BigInt("10000000000000"),
          minAmountOut: BigInt("0"),
        },
        tx
      );

      tx.transferObjects(
        [suiSwapCoin, usdSwapCoin, suiCoin, usdcCoin],
        sdk.senderAddress
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
      const poolModule = new PoolModule(sdk);
      const tx = new Transaction();

      const suiCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::sui::SUI`],
        arguments: [
          tx.object(suiTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      const usdcCoin = tx.moveCall({
        target: "0x2::coin::mint",
        typeArguments: [`${STEAMM_PKG_ID}::usdc::USDC`],
        arguments: [
          tx.object(usdcTreasuryCap),
          tx.pure.u64(BigInt("1000000000000000000")),
        ],
      });

      //////////////////////////////////////////////////////////////

      const [bTokenA, bTokenB, lpToken, _depositResult] =
        await poolModule.depositLiquidity(
          {
            pool: pools[0].poolId,
            coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
            coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
            coinObjA: usdcCoin,
            coinObjB: suiCoin,
            maxA: BigInt("1000000000000000000"),
            maxB: BigInt("1000000000000000000"),
          },
          tx
        );

      //////////////////////////////////////////////////////////////

      await poolModule.redeemLiquidityEntry(
        {
          pool: pools[0].poolId,
          coinTypeA: `${STEAMM_PKG_ID}::usdc::USDC`,
          coinTypeB: `${STEAMM_PKG_ID}::sui::SUI`,
          lpCoinObj: lpToken,
          minA: BigInt("0"),
          minB: BigInt("0"),
        },
        tx
      );

      tx.transferObjects(
        [suiCoin, usdcCoin, bTokenA, bTokenB],
        sdk.senderAddress
      );

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
