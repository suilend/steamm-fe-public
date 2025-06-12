import { Transaction } from "@mysten/sui/transactions";

import { BankAbi, ParsedBank, SteammSDK } from "@suilend/steamm-sdk";
import { API_URL } from "@suilend/sui-fe";
import { showErrorToast } from "@suilend/sui-fe-next";

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

export const patchBank = async (bank: ParsedBank) => {
  try {
    await fetch(`${API_URL}/steamm/banks/${bank.id}`, {
      method: "PATCH",
    });
  } catch (err) {
    showErrorToast("Failed to refresh bank", err as Error);
    console.error(err);
  }
};
