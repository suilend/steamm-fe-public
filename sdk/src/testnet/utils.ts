import {
  Transaction,
  TransactionArgument,
} from "@mysten/sui/dist/cjs/transactions";
import { TEST_FAUCET_PKG_ID } from "./testnet";

// TODO: move to test module
export function getTestSui(
  tx: Transaction,
  amount: number
): TransactionArgument {
  return getTesCoin(
    tx,
    amount,
    "0xe4ce0b27f57363f39fa30192a940533ed966dffae947927bb33214e1eda91eb6",
    "0x233f0e47651aaa1aa9884b3f099f1fe5532b99a7a988654c38f7220dcd44eb34::sui::SUI"
  );
}

export function getTestUsdc(
  tx: Transaction,
  amount: number
): TransactionArgument {
  return getTesCoin(
    tx,
    amount,
    "0xc4158576dba4442873760a5cbd819f221ebaec99629dc6210ae93fac96911eed",
    "0x233f0e47651aaa1aa9884b3f099f1fe5532b99a7a988654c38f7220dcd44eb34::usdc::USDC"
  );
}

export function getTesCoin(
  tx: Transaction,
  amount: number,
  faucetId: string,
  coinType: string
): TransactionArgument {
  const treasuryCapRef = tx.moveCall({
    target: `${TEST_FAUCET_PKG_ID}::faucets::get_faucet`,
    typeArguments: [coinType],
    arguments: [tx.object(faucetId)],
  });

  return tx.moveCall({
    target: `0x2::coin::mint`,
    typeArguments: [coinType],
    arguments: [tx.object(treasuryCapRef), tx.pure.u64(amount)],
  });
}
