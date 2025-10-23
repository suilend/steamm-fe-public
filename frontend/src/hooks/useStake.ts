import { MouseEvent, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";

import {
  createObligationIfNoneExists,
  sendObligationToUser,
} from "@suilend/sdk";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { MAX_DEPOSITS_PER_OBLIGATION } from "@/lib/constants";
import { formatPair } from "@/lib/format";
import { getIndexesOfObligationsWithDeposit } from "@/lib/obligation";
import { showSuccessTxnToast } from "@/lib/toasts";
import { PoolPosition } from "@/lib/types";

const useStake = (
  poolPosition?: PoolPosition,
  setStakedPercentOverride?: (
    stakedPercentOverride: BigNumber | undefined,
  ) => void,
) => {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { appData } = useLoadedAppContext();
  const { refreshRawBalancesMap, getBalance, userData, refreshUserData } =
    useUserContext();

  const [isStaking, setIsStaking] = useState<boolean>(false);

  const onStakeClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (userData === undefined || poolPosition === undefined) return;

    try {
      if (isStaking) return;
      if (!address) throw Error("Wallet not connected");

      setIsStaking(true);

      const submitAmount = new BigNumber(
        getBalance(poolPosition.pool.lpTokenType),
      )
        .times(
          10 ** appData.coinMetadataMap[poolPosition.pool.lpTokenType].decimals,
        )
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      const transaction = new Transaction();

      let obligationIndexes = getIndexesOfObligationsWithDeposit(
        userData.obligations,
        poolPosition.pool.lpTokenType,
      );
      if (obligationIndexes.length === 0)
        obligationIndexes = [
          userData.obligations.findIndex(
            (obligation) =>
              obligation.depositPositionCount < MAX_DEPOSITS_PER_OBLIGATION,
          ),
        ]; // Get first obligation with less than MAX_DEPOSITS_PER_OBLIGATION deposits (if any)
      console.log("XXX obligationIndexes:", obligationIndexes);

      const { obligationOwnerCapId, didCreate } = createObligationIfNoneExists(
        appData.suilend.lmMarket.suilendClient,
        transaction,
        obligationIndexes[0] !== -1
          ? userData.obligationOwnerCaps[obligationIndexes[0]] // Deposit into first obligation with deposits of the LP token type, or with less than 5 deposits
          : undefined, // Create obligation (no obligations OR no obligations with less than 5 deposits)
      );
      await appData.suilend.lmMarket.suilendClient.depositIntoObligation(
        address,
        poolPosition.pool.lpTokenType,
        submitAmount,
        transaction,
        obligationOwnerCapId,
      );
      if (didCreate)
        sendObligationToUser(obligationOwnerCapId, address, transaction);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        [
          "Staked",
          formatPair(
            poolPosition.pool.coinTypes.map(
              (coinType) => appData.coinMetadataMap[coinType].symbol,
            ),
          ),
          "LP tokens",
        ].join(" "),
        txUrl,
      );

      if (setStakedPercentOverride) {
        setStakedPercentOverride(new BigNumber(100)); // Override to prevent double-counting while refreshing
        setTimeout(() => {
          setStakedPercentOverride(undefined);
        }, 5000);
      }
    } catch (err) {
      showErrorToast(
        "Failed to stake LP tokens",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsStaking(false);

      // The order of these two calls is important (refreshRawBalancesMap must be called after refreshUserData so the pool position doesn't disappear while the new obligations are still being fetched)
      await refreshUserData();
      await refreshRawBalancesMap();
    }
  };

  return { isStaking, onStakeClick };
};

export default useStake;
