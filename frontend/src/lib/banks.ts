import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { Bank, SteammSDK } from "@suilend/steamm-sdk";

import { PoolsData } from "@/contexts/AppContext";
import { ParsedBank } from "@/lib/types";

export const rebalanceBanksIfNeeded = (
  banks: ParsedBank[],
  steammClient: SteammSDK,
  transaction: Transaction,
) => {
  for (const bank of banks) {
    if (!bank.bank.lending) continue;
    const targetUtilPercent = new BigNumber(
      bank.bank.lending.targetUtilisationBps / 100,
    );
    const utilBufferPercent = new BigNumber(
      bank.bank.lending.utilisationBufferBps / 100,
    );

    if (
      bank.utilizationPercent.lt(targetUtilPercent.minus(utilBufferPercent)) ||
      bank.utilizationPercent.gt(targetUtilPercent.plus(utilBufferPercent))
    ) {
      // Rebalance if util is outside [targetUtilPercent - utilBufferPercent, targetUtilPercent + utilBufferPercent]
      new Bank(steammClient.packageInfo(), bank.bankInfo).rebalance(
        transaction,
      );
    }
  }
};

export const getBankPrice = (
  bank: ParsedBank,
  poolsData: PoolsData | undefined,
) => {
  if (poolsData === undefined) return undefined;

  const pool = poolsData.pools.find((p) => p.coinTypes.includes(bank.coinType));
  if (!pool) return undefined;

  return pool.coinTypes[0] === bank.coinType ? pool.prices[0] : pool.prices[1];
};
