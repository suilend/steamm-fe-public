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

export const getIndexesOfObligationsWithDeposit = (
  obligations: ParsedObligation[],
  coinType: string,
) =>
  obligations
    .map((obligation, index) =>
      !!getObligationDepositPosition(obligation, coinType) ? index : undefined,
    )
    .filter((index) => index !== undefined);
