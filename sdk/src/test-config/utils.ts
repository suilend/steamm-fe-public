import {
  Transaction,
  TransactionArgument,
} from "@mysten/sui/dist/cjs/transactions";
import { STEAMM_TESTNET_PKG_ID } from "./testnet";

const SUI_FAUCET = "0x6138cdbc64a4e620bb5b66e8a3b87099fdcaed580fab67316ddc7bfb9bb460f4";
const USDC_FAUCET = "0x372bcf55b8f0220fa273fe34982c648c9e7cf44f28e1ebd0d899211634ebf12b";

export function getTestSui(
  tx: Transaction,
  amount: number
): TransactionArgument {
  return getTestCoin(
    tx,
    amount,
    SUI_FAUCET,
    `${STEAMM_TESTNET_PKG_ID}::sui::SUI`
  );
}

export function getTestUsdc(
  tx: Transaction,
  amount: number
): TransactionArgument {
  return getTestCoin(
    tx,
    amount,
    USDC_FAUCET,
    `${STEAMM_TESTNET_PKG_ID}::usdc::USDC`
  );
}

export function getTestCoin(
  tx: Transaction,
  amount: number,
  faucetId: string,
  coinType: string
): TransactionArgument {
  return tx.moveCall({
    target: `${STEAMM_TESTNET_PKG_ID}::faucets::get_coins`,
    typeArguments: [coinType],
    arguments: [tx.object(faucetId), tx.pure.u64(amount)],
  });
}
