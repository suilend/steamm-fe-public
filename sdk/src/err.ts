import {
  DevInspectResults,
  DryRunTransactionBlockResponse,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";

export type ErrorInfo = {
  tag: string;
  msg: string;
};

type ErrorMaps = {
  [module: string]: {
    [code: number]: ErrorInfo;
  };
};

export const ERROR_MAPS: ErrorMaps = {
  pool_math: {
    0: {
      tag: "EDepositRatioInvalid",
      msg: "When the deposit max parameter ratio is invalid",
    },
    1: {
      tag: "ERedeemSlippageAExceeded",
      msg: "The amount of coin A reedemed is below the minimum set",
    },
    2: {
      tag: "ERedeemSlippageBExceeded",
      msg: "The amount of coin B reedemed is below the minimum set",
    },
    3: {
      tag: "ELpSupplyToReserveRatioViolation",
      msg: "Assert that the reserve to lp supply ratio updates in favor of of the pool. This error should not occur",
    },
    4: {
      tag: "EDepositMaxAParamCantBeZero",
      msg: "When depositing the max deposit params cannot be zero",
    },
    5: {
      tag: "EDepositRatioLeadsToZeroA",
      msg: "The deposit ratio computed leads to a coin A deposit of zero",
    },
  },
  pool: {
    0: {
      tag: "EInvalidLpDecimals",
      msg: "Error when LP token decimals are not 9",
    },
    1: {
      tag: "ELpSupplyMustBeZero",
      msg: "Error when trying to initialize a pool with non-zero LP supply",
    },
    2: {
      tag: "EInvalidSwapFeeBpsType",
      msg: "Error when swap fee bps is not one of the allowed values",
    },
    3: {
      tag: "ESwapExceedsSlippage",
      msg: "Occurs when the swap amount_out is below the minimum amount out declared",
    },
    4: {
      tag: "EOutputExceedsLiquidity",
      msg: "When the coin output exceeds the amount of reserves available",
    },
    5: {
      tag: "ELpSupplyToReserveRatioViolation",
      msg: "Assert that the reserve to lp supply ratio updates in favor of of the pool. This error should not occur",
    },
    6: {
      tag: "ESwapOutputAmountIsZero",
      msg: "The swap leads to zero output amount",
    },
    7: {
      tag: "EInsufficientFunds",
      msg: "When the user coin object does not have enough balance to fulfil the swap",
    },
    8: {
      tag: "ETypeAandBDuplicated",
      msg: "When creating a pool and the type `A` and `B` are duplicated",
    },
    9: {
      tag: "ELpTokenEmpty",
      msg: "Empty LP Token when redeeming liquidity",
    },
    10: {
      tag: "EEmptyLpCoin",
      msg: "Empty LP coin",
    },
    11: {
      tag: "EEmptyCoins",
      msg: "Empty coin A and B when depositing or swapping",
    },
  },
  bank_math: {
    0: {
      tag: "EOutputExceedsTotalBankReserves",
      msg: "Output exceeds total bank reserves",
    },
    1: {
      tag: "EEmptyBank",
      msg: "Empty bank",
    },
  },
  bank: {
    0: {
      tag: "EBTokenTypeInvalid",
      msg: 'bToken name must start with "B_" followed by underlying token name',
    },
    1: {
      tag: "EInvalidBTokenDecimals",
      msg: "bToken decimals must be 9",
    },
    2: {
      tag: "EBTokenSupplyMustBeZero",
      msg: "bToken treasury must have zero supply when creating bank",
    },
    3: {
      tag: "EUtilisationRangeAboveHundredPercent",
      msg: "Target utilisation + buffer cannot exceed 100%",
    },
    4: {
      tag: "EUtilisationRangeBelowZeroPercent",
      msg: "Target utilisation must be greater than buffer",
    },
    5: {
      tag: "ELendingAlreadyActive",
      msg: "Bank already has lending initialized",
    },
    6: {
      tag: "ECTokenRatioTooLow",
      msg: "Insufficient cTokens in reserve after redemption",
    },
    7: {
      tag: "ELendingNotActive",
      msg: "Lending must be initialized first",
    },
    8: {
      tag: "ECompoundedInterestNotUpdated",
      msg: "Interest must be compounded before operation",
    },
    9: {
      tag: "EInsufficientBankFunds",
      msg: "Bank has insufficient funds for withdrawal",
    },
    10: {
      tag: "EInsufficientCoinBalance",
      msg: "Input coin balance too low for requested operation",
    },
    11: {
      tag: "EEmptyCoinAmount",
      msg: "Cannot deposit zero coins",
    },
    12: {
      tag: "EEmptyBToken",
      msg: "Cannot burn empty bToken",
    },
    13: {
      tag: "EInvalidBtokenBalance",
      msg: "bToken balance less than amount to burn",
    },
    14: {
      tag: "ENoBTokensToBurn",
      msg: "No bTokens available to burn after minimum liquidity check",
    },
    15: {
      tag: "ENoTokensToWithdraw",
      msg: "No tokens available to withdraw after calculations",
    },
    16: {
      tag: "EInitialDepositBelowMinimumLiquidity",
      msg: "First deposit must be greater than minimum liquidity",
    },
  },
  cpmm: {
    0: {
      tag: "EInvariantViolation",
      msg: "Product of reserves after swap is less than before swap",
    },
    1: {
      tag: "EZeroInvariant",
      msg: "Product of reserves plus offset equals zero",
    },
  },
  omm: {
    0: {
      tag: "EInvalidBankType",
      msg: "Bank's bToken type does not correspond to pool bToken type",
    },
    1: {
      tag: "EInvalidOracleIndex",
      msg: "Oracle Price object does not correspond to correct Oracle Index",
    },
    2: {
      tag: "EInvalidOracleRegistry",
      msg: "Incorrect Oracle Registry",
    },
  },
  version: {
    0: {
      tag: "EIncorrectVersion",
      msg: "When the package called has an outdated version",
    },
  },
};

export type MoveLocation = {
  module: {
    address: string;
    name: string;
  };
  function: number;
  instruction: number;
  functionName: string | null;
};

export type ParsedMoveAbort = {
  location: MoveLocation;
  errorCode: number;
  errorInfo: ErrorInfo;
  command: number;
};

export function parseMoveAbortError(
  errorString: string,
): ParsedMoveAbort | string {
  const moveAbortIndex = errorString.indexOf("MoveAbort");
  if (moveAbortIndex === -1) {
    return `Error is not move abort: ${errorString}`;
  }
  errorString = errorString.slice(moveAbortIndex);

  if (!errorString.startsWith("MoveAbort")) {
    return `Error is not move abort: ${errorString}`;
  }

  // Match the pattern: MoveAbort(...) in command X
  const regex =
    /MoveAbort\(MoveLocation \{ module: ModuleId \{ address: ([a-f0-9]+), name: Identifier\("([^"]+)"\) \}, function: (\d+), instruction: (\d+), function_name: Some\("([^"]+)"\) \}, (\d+)\) in command (\d+)/;

  const match = errorString.match(regex);
  if (!match) return `Unable to parse: ${errorString}`;

  const [
    _,
    address,
    name,
    functionId,
    instruction,
    functionName,
    errorCode,
    command,
  ] = match;

  return {
    location: {
      module: {
        address,
        name,
      },
      function: parseInt(functionId),
      instruction: parseInt(instruction),
      functionName: functionName || null,
    },
    errorCode: parseInt(errorCode),
    errorInfo: ERROR_MAPS[name][parseInt(errorCode)],
    command: parseInt(command),
  };
}

export function parseErrorCode(
  txResponse:
    | DevInspectResults
    | DryRunTransactionBlockResponse
    | SuiTransactionBlockResponse,
): { module: string; error: ErrorInfo } | string | null {
  const error = txResponse.effects?.status.error;

  if (!error) return null;

  const parsed = parseMoveAbortError(error);
  if (typeof parsed === "string") return parsed;

  const moduleName = parsed.location.module.name;
  const errorMap = ERROR_MAPS[moduleName];

  if (!errorMap) return null;

  const errorInfo = errorMap[parsed.errorCode];
  if (!errorInfo) return null;

  return {
    module: moduleName,
    error: errorInfo,
  };
}
