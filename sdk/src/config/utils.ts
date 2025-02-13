import { Transaction, TransactionArgument } from "@mysten/sui/transactions";

import { STEAMM_BETA_PKG_ID } from "./mainnetBeta";
import { STEAMM_TESTNET_PKG_ID } from "./testnet";

const SUI_TESTNET_FAUCET =
  "0xe8a6641b683683a63b80a2ed75f328a7385852be33fbd3468ad07c75f12040e9";
const USDC_TESTNET_FAUCET =
  "0xadb49ed4c32b491cc399766faa20460cde003d6e0203b3625ea11be25612c2dc";

const SUI_BETA_FAUCET =
  "0x9d0becdf94261d9767b66f1eeee042cf17a2cb5cca534241c4405faaea3b24a2";
const USDC_BETA_FAUCET =
  "0xdc117526e0177bc1aa7ce9b5f8df35c9440e9ad433831663c951edfda407a04e";

export function getTestSui(
  tx: Transaction,
  amount: number,
  network: "testnet" | "mainnet",
): TransactionArgument {
  const faucetId = network === "testnet" ? SUI_TESTNET_FAUCET : SUI_BETA_FAUCET;
  const coinType =
    network === "testnet"
      ? `${STEAMM_TESTNET_PKG_ID}::sui::SUI`
      : `${STEAMM_BETA_PKG_ID}::sui::SUI`;

  return getTestCoin(tx, amount, faucetId, coinType, network);
}

export function getTestUsdc(
  tx: Transaction,
  amount: number,
  network: "testnet" | "mainnet",
): TransactionArgument {
  const faucetId =
    network === "testnet" ? USDC_TESTNET_FAUCET : USDC_BETA_FAUCET;
  const coinType =
    network === "testnet"
      ? `${STEAMM_TESTNET_PKG_ID}::usdc::USDC`
      : `${STEAMM_BETA_PKG_ID}::usdc::USDC`;

  return getTestCoin(tx, amount, faucetId, coinType, network);
}

export function getTestCoin(
  tx: Transaction,
  amount: number,
  faucetId: string,
  coinType: string,
  network: "testnet" | "mainnet",
): TransactionArgument {
  const packageId =
    network === "testnet" ? STEAMM_TESTNET_PKG_ID : STEAMM_BETA_PKG_ID;

  return tx.moveCall({
    target: `${packageId}::faucets::get_coins`,
    typeArguments: [coinType],
    arguments: [tx.object(faucetId), tx.pure.u64(amount)],
  });
}
