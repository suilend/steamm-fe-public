import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import { formatToken, formatUsd, getToken } from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { Bank } from "@suilend/steamm-sdk";
import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";

import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import PoolTypeTag from "@/components/pool/PoolTypeTag";
import Tag from "@/components/Tag";
import TokenLogo from "@/components/TokenLogo";
import TokenLogos from "@/components/TokenLogos";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { formatFeeTier, formatPair } from "@/lib/format";
import { POOL_URL_PREFIX } from "@/lib/navigation";
import { getPoolSlug } from "@/lib/pools";
import { showSuccessTxnToast } from "@/lib/toasts";
import { ParsedPool } from "@/lib/types";

interface PoolCardProps {
  pool: ParsedPool;
}

export default function PoolCard({ pool }: PoolCardProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData, banksData } = useLoadedAppContext();
  const { refresh } = useUserContext();

  // Claim fees
  const [isClaimingFees, setIsClaimingFees] = useState<boolean>(false);

  const claimFees = async (pool: ParsedPool) => {
    if (banksData === undefined) return;
    if (address !== ADMIN_ADDRESS) return;

    try {
      if (!address) throw new Error("Wallet not connected");

      setIsClaimingFees(true);

      const transaction = new Transaction();

      const [bTokenA, bTokenB] = steammClient.Pool.collectProtocolFees(
        pool.poolInfo,
        transaction,
      );

      const coinA = new Bank(
        steammClient.packageInfo(),
        banksData.bankMap[pool.coinTypes[0]].bankInfo,
      ).burnBTokens(transaction, {
        btokens: bTokenA,
        btokenAmount: pool.pool.protocolFees.feeA.value,
      });
      const coinB = new Bank(
        steammClient.packageInfo(),
        banksData.bankMap[pool.coinTypes[1]].bankInfo,
      ).burnBTokens(transaction, {
        btokens: bTokenB,
        btokenAmount: pool.pool.protocolFees.feeB.value,
      });
      transaction.transferObjects([bTokenA, bTokenB, coinA, coinB], address);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast("Claimed fees", txUrl);
    } catch (err) {
      showErrorToast("Failed to claim fees", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsClaimingFees(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border p-4">
      {/* Top */}
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex w-full flex-row items-center gap-2">
          <TokenLogos coinTypes={pool.coinTypes} size={16} />
          <p className="text-p1 text-foreground">
            {formatPair(
              pool.coinTypes.map(
                (coinType) => appData.coinMetadataMap[coinType].symbol,
              ),
            )}
          </p>

          <div className="flex flex-row items-center gap-px">
            <PoolTypeTag className="rounded-r-[0] pr-2" pool={pool} />
            <Tag className="rounded-l-[0] pl-2">
              {formatFeeTier(pool.feeTierPercent)}
            </Tag>
          </div>
        </div>

        <OpenUrlNewTab
          url={`${POOL_URL_PREFIX}/${pool.id}-${getPoolSlug(appData, pool)}`}
        />
      </div>

      <div className="flex w-full flex-col gap-6">
        {/* Parameters */}
        <div className="flex w-full flex-col gap-2">
          <Parameter label="TVL" isHorizontal>
            <Tooltip title={formatUsd(pool.tvlUsd, { exact: true })}>
              <p className="text-p2 text-foreground">
                {formatUsd(pool.tvlUsd)}
              </p>
            </Tooltip>
          </Parameter>
        </div>

        {/* Claimable fees */}
        <Parameter label="Claimable fees" isHorizontal>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex flex-col items-end gap-1">
              {pool.coinTypes.map((coinType, index) => {
                if (banksData === undefined)
                  return <Skeleton key={coinType} className="h-[21px] w-24" />;

                const feeAmount = new BigNumber(
                  (index === 0
                    ? pool.pool.protocolFees.feeA
                    : pool.pool.protocolFees.feeB
                  ).value.toString(),
                )
                  .times(banksData.bankMap[coinType].bTokenExchangeRate)
                  .div(10 ** appData.coinMetadataMap[coinType].decimals);

                return (
                  <div
                    key={coinType}
                    className="flex flex-row items-center gap-2"
                  >
                    <TokenLogo
                      token={getToken(
                        coinType,
                        appData.coinMetadataMap[coinType],
                      )}
                      size={16}
                    />
                    <Tooltip
                      title={`${formatToken(feeAmount, {
                        dp: appData.coinMetadataMap[coinType].decimals,
                      })} ${appData.coinMetadataMap[coinType].symbol}`}
                    >
                      <p className="text-p2 text-foreground">
                        {formatToken(feeAmount, { exact: false })}{" "}
                        {appData.coinMetadataMap[coinType].symbol}
                      </p>
                    </Tooltip>

                    <Tooltip
                      title={formatUsd(feeAmount.times(pool.prices[index]), {
                        exact: true,
                      })}
                    >
                      <p className="text-p2 text-secondary-foreground">
                        {formatUsd(feeAmount.times(pool.prices[index]))}
                      </p>
                    </Tooltip>
                  </div>
                );
              })}
            </div>

            <button
              className="group flex h-6 w-[48px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => claimFees(pool)}
              disabled={address !== ADMIN_ADDRESS}
            >
              {isClaimingFees ? (
                <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
              ) : (
                <p className="text-p3 text-button-2-foreground">Claim</p>
              )}
            </button>
          </div>
        </Parameter>
      </div>
    </div>
  );
}
