import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import { BankAbi, BankInfo, SteammSDK } from "@suilend/steamm-sdk";

import { AppData } from "@/contexts/AppContext";
import { ParsedBank } from "@/lib/types";

export const rebalanceBanks = (
  banks: ParsedBank[],
  steammClient: SteammSDK,
  transaction: Transaction,
) => {
  for (const bank of banks) {
    if (!bank.bank.lending) continue;
    new BankAbi(steammClient.steammInfo, bank.bankInfo).rebalance(transaction);
  }
};

export const getParsedBank = (
  appData: Pick<AppData, "suilend" | "coinMetadataMap">,
  bankInfo: BankInfo,
  bank: ParsedBank["bank"],
  totalFundsRaw: number,
): ParsedBank => {
  const { suilend, coinMetadataMap } = appData;

  const id = bankInfo.bankId;
  const coinType = bankInfo.coinType;
  const bTokenType = bankInfo.btokenType;

  const totalFunds = new BigNumber(totalFundsRaw.toString()).div(
    10 ** coinMetadataMap[coinType].decimals,
  );

  const fundsAvailable = new BigNumber(
    bank.fundsAvailable.value.toString(),
  ).div(10 ** coinMetadataMap[coinType].decimals);
  const fundsDeployed = totalFunds.minus(fundsAvailable);

  const bTokenSupply = new BigNumber(bank.btokenSupply.value.toString()).div(
    10 ** coinMetadataMap[coinType].decimals,
  );
  const bTokenExchangeRate = totalFunds.div(bTokenSupply);

  const utilizationPercent = totalFunds.gt(0)
    ? fundsDeployed.div(totalFunds).times(100)
    : new BigNumber(0);
  const suilendDepositAprPercent =
    suilend.mainMarket.depositAprPercentMap[coinType] ?? new BigNumber(0);

  return {
    id,
    bank,
    bankInfo,
    coinType,
    bTokenType,

    fundsAvailable,
    fundsDeployed,
    totalFunds,

    bTokenSupply,
    bTokenExchangeRate,

    utilizationPercent,
    suilendDepositAprPercent,
  };
};
