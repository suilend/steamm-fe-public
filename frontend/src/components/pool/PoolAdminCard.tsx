import Link from "next/link";
import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { ExternalLink, Loader2 } from "lucide-react";

import { ADMIN_ADDRESS, QuoterId } from "@suilend/steamm-sdk";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";

import Tag from "@/components/Tag";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { usePoolContext } from "@/contexts/PoolContext";
import { useUserContext } from "@/contexts/UserContext";
import { SUILEND_URL } from "@/lib/navigation";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

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

  // Suilend LM reserve
  const [isCreatingSuilendLmReserve, setIsCreatingSuilendLmReserve] =
    useState<boolean>(false);

  const createSuilendLmReserve = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsCreatingSuilendLmReserve(true);

      const transaction = new Transaction();

      const decimals = appData.coinMetadataMap[pool.lpTokenType].decimals;

      await appData.suilend.lmMarket.suilendClient.createReserve(
        appData.suilend.lmMarket.lendingMarket.ownerCapId,
        transaction,
        "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
        pool.lpTokenType,
        {
          openLtvPct: Number(0),
          closeLtvPct: Number(0),
          maxCloseLtvPct: Number(0),
          borrowWeightBps: BigInt("18446744073709551615"),
          depositLimit: BigInt(
            new BigNumber(1000000000).times(10 ** decimals).toString(),
          ),
          borrowLimit: BigInt(
            new BigNumber(0).times(10 ** decimals).toString(),
          ),
          liquidationBonusBps: BigInt(300),
          maxLiquidationBonusBps: BigInt(500),
          depositLimitUsd: BigInt(1000000000),
          borrowLimitUsd: BigInt(0),
          borrowFeeBps: BigInt(30),
          spreadFeeBps: BigInt(2000),
          protocolLiquidationFeeBps: BigInt(199),
          openAttributedBorrowLimitUsd: BigInt(0),
          closeAttributedBorrowLimitUsd: BigInt(0),
          interestRateUtils: [0, 100],
          interestRateAprs: [BigInt(0), BigInt(0)],
          isolated: false,
        },
      );

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Created Suilend LM reserve", txUrl);
    } catch (err) {
      showErrorToast(
        "Failed to create Suilend LM reserve",
        err as Error,
        undefined,
        true,
      );
      console.error(err);
    } finally {
      setIsCreatingSuilendLmReserve(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 rounded-md border border-error/25 bg-error/5 p-5">
      {/* OMMv2 */}
      {pool.quoterId === QuoterId.ORACLE_V2 && (
        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-row items-center gap-3">
            <p className="text-p1 text-foreground">OMMv2</p>

            <div className="flex flex-row items-center gap-2">
              {hasOmmV2UpdateFlag === undefined ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Tag>{hasOmmV2UpdateFlag ? "Updated" : "Not updated"}</Tag>
              )}

              {isOmmV2Paused === undefined ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <Tag>{isOmmV2Paused ? "Paused" : "Active"}</Tag>
              )}
            </div>
          </div>

          {isOmmV2Paused === undefined ? (
            <Skeleton className="h-5 w-16" />
          ) : (
            <button
              className={cn(
                "group flex h-6 flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50",
                isOmmV2Paused ? "w-[61px]" : "w-[49px]",
              )}
              disabled={isPausingResuming}
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
        </div>
      )}

      {/* Suilend LM */}
      <div className="flex w-full flex-col gap-2">
        <p className="text-p1 text-foreground">Suilend LM</p>

        {appData.suilend.lmMarket.reserveMap[pool.lpTokenType] ? (
          <Link
            className="flex h-6 w-max flex-row items-center gap-1 rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
            target="_blank"
            href={`${SUILEND_URL}/admin?${new URLSearchParams({
              lendingMarketId: appData.suilend.lmMarket.lendingMarket.id,
              tab: "reserves",
              coinType: pool.lpTokenType,
            })}`}
          >
            <p className="text-p3 text-button-2-foreground">Manage reserve</p>
            <ExternalLink className="h-3 w-3 text-button-2-foreground" />
          </Link>
        ) : (
          <button
            className="flex h-6 w-[97px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
            disabled={isCreatingSuilendLmReserve}
            onClick={createSuilendLmReserve}
          >
            {isCreatingSuilendLmReserve ? (
              <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
            ) : (
              <p className="text-p3 text-button-2-foreground">Create reserve</p>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
