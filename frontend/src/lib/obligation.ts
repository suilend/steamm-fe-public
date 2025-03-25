import BigNumber from "bignumber.js";

import { ParsedObligation } from "@suilend/sdk";

export const getObligationDepositPosition = (
  obligation: ParsedObligation | undefined,
  coinType: string,
) => obligation?.deposits.find((d) => d.coinType === coinType);

export const getObligationDepositedAmount = (
  obligation: ParsedObligation | undefined,
  coinType: string,
) =>
  getObligationDepositPosition(obligation, coinType)?.depositedAmount ??
  new BigNumber(0);

export const getIndexOfObligationWithDeposit = (
  obligations: ParsedObligation[],
  coinType: string,
) =>
  obligations.findIndex(
    (obligation) => !!getObligationDepositPosition(obligation, coinType),
  ); // Assumes up to one obligation has deposits of the LP token type
