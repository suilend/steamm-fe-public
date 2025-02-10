import { Transaction, TransactionArgument } from "@mysten/sui/transactions";

import { STEAMM_BETA_PKG_ID } from "./mainnet";
import { STEAMM_TESTNET_PKG_ID } from "./testnet";

const SUI_TESTNET_FAUCET =
  "0x6138cdbc64a4e620bb5b66e8a3b87099fdcaed580fab67316ddc7bfb9bb460f4";
const USDC_TESTNET_FAUCET =
  "0x372bcf55b8f0220fa273fe34982c648c9e7cf44f28e1ebd0d899211634ebf12b";

const SUI_BETA_FAUCET =
  "0xab20e561f4a3a77361ff13298dd111b38f4c44457785ec7cec15c48903d272fb";
const USDC_BETA_FAUCET =
  "0xc259c0212f5b5e7dd409324163ac557bda8b63a1bc86e667cd76ecb7d67bc9f7";

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
