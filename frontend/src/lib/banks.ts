import { Transaction } from "@mysten/sui/transactions";

import { BankAbi, ParsedBank, SteammSDK } from "@suilend/steamm-sdk";

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
