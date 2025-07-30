import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Loader2 } from "lucide-react";

import { ADMIN_ADDRESS, BankAbi, QuoterId } from "@suilend/steamm-sdk";
import { formatUsd } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Tag from "@/components/Tag";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { usePoolPositionsContext } from "@/contexts/PoolPositionsContext";
import { useUserContext } from "@/contexts/UserContext";
import useStake from "@/hooks/useStake";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function PoolAdminCard() {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { refresh } = useUserContext();
  const { pool, hasOmmV2UpdateFlag, isOmmV2Paused } = usePoolContext();

  // OMM v2/v3
  const [isPausingResuming, setIsPausingResuming] = useState<boolean>(false);

  const pausePool = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsPausingResuming(true);

      const transaction = new Transaction();

      transaction.moveCall({
        target:
          "0x5d7c7f59ac2b12325b73fcdc850e80b52470e954c09f0c57d056b0406d236890::omm_v2::pause_pool",
        typeArguments: [
          pool.bTokenTypes[0],
          pool.bTokenTypes[1],
          pool.lpTokenType,
        ],
        arguments: [
          transaction.object(pool.id),
          transaction.object(
            steammClient.sdkOptions.packages.steamm.config!.globalAdmin,
          ),
        ],
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Paused pool", txUrl);
    } catch (err) {
      showErrorToast("Failed to pause pool", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsPausingResuming(false);
      refresh();
    }
  };

  const resumePool = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsPausingResuming(true);

      const transaction = new Transaction();

      transaction.moveCall({
        target:
          "0x5d7c7f59ac2b12325b73fcdc850e80b52470e954c09f0c57d056b0406d236890::omm_v2::resume_pool",
        typeArguments: [
          pool.bTokenTypes[0],
          pool.bTokenTypes[1],
          pool.lpTokenType,
        ],
        arguments: [
          transaction.object(pool.id),
          transaction.object(
            steammClient.sdkOptions.packages.steamm.config!.globalAdmin,
          ),
        ],
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Resumed pool", txUrl);
    } catch (err) {
      showErrorToast("Failed to resume pool", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsPausingResuming(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-1 rounded-md border p-5">
      <p className="text-p2 text-secondary-foreground">Admin</p>

      {pool.quoterId === QuoterId.ORACLE_V2 && (
        <>
          <div className="flex flex-row items-center gap-2">
            {hasOmmV2UpdateFlag === undefined ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Tag>OMM{hasOmmV2UpdateFlag ? "v3" : "v2"}</Tag>
            )}

            {isOmmV2Paused === undefined ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <Tag>{isOmmV2Paused ? "Paused" : "Active"}</Tag>
            )}
          </div>

          {isOmmV2Paused === undefined ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <button
              className="group flex h-6 w-[60px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
              onClick={isOmmV2Paused ? resumePool : pausePool}
            >
              {isPausingResuming ? (
                <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
              ) : (
                <p className="text-p3 text-button-2-foreground">
                  {isOmmV2Paused ? "Resume" : "Pause"}
                </p>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
