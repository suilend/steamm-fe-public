import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2, Plus } from "lucide-react";

import { formatToken, formatUsd, getToken } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import { BankAbi, ParsedPool } from "@suilend/steamm-sdk";
import { ADMIN_ADDRESS } from "@suilend/steamm-sdk";

import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import PoolLabel from "@/components/pool/PoolLabel";
import SuilendLogo from "@/components/SuilendLogo";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { SUILEND_URL } from "@/lib/navigation";
import { getPoolUrl } from "@/lib/pools";
import { showSuccessTxnToast } from "@/lib/toasts";

interface PoolCardProps {
  pool: ParsedPool;
}

export default function PoolCard({ pool }: PoolCardProps) {
  const { explorer } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { refresh } = useUserContext();

  // Suilend LM
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

  // Claim fees
  const [isClaimingFees, setIsClaimingFees] = useState<boolean>(false);

  const claimFees = async (pool: ParsedPool) => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsClaimingFees(true);

      const transaction = new Transaction();

      const [bTokenA, bTokenB] = steammClient.Pool.collectProtocolFees(
        pool.poolInfo,
        transaction,
      );

      const coinA = new BankAbi(
        steammClient.steammInfo,
        appData.bankMap[pool.coinTypes[0]].bankInfo,
      ).burnBTokens(transaction, {
        btokens: bTokenA,
        btokenAmount: pool.pool.protocolFees.feeA.value,
      });
      const coinB = new BankAbi(
        steammClient.steammInfo,
        appData.bankMap[pool.coinTypes[1]].bankInfo,
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
      <div className="flex w-full flex-row justify-between gap-4">
        <PoolLabel className="flex-1" wrap pool={pool} />

        <div className="flex h-6 flex-row items-center gap-3">
          <div className="flex flex-row items-center gap-2">
            <SuilendLogo size={14} />

            {appData.suilend.lmMarket.reserveMap[pool.lpTokenType] ? (
              <OpenUrlNewTab
                className="h-4 w-4"
                url={`${SUILEND_URL}/admin?${new URLSearchParams({
                  lendingMarketId: appData.suilend.lmMarket.lendingMarket.id,
                  tab: "reserves",
                  coinType: pool.lpTokenType,
                })}`}
                tooltip="Manage on Suilend"
              />
            ) : (
              <Tooltip title="Create Suilend LM reserve">
                <button
                  className="group/create-pool h-4 w-4 disabled:pointer-events-none disabled:opacity-50"
                  onClick={createSuilendLmReserve}
                  disabled={address !== ADMIN_ADDRESS}
                >
                  {isCreatingSuilendLmReserve ? (
                    <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
                  ) : (
                    <Plus className="h-4 w-4 text-secondary-foreground transition-colors group-hover/create-pool:text-foreground" />
                  )}
                </button>
              </Tooltip>
            )}
          </div>

          <div className="h-4 w-px bg-border" />
          <OpenUrlNewTab url={getPoolUrl(appData, pool)} tooltip="Go to pool" />
        </div>
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
                const feeAmount = new BigNumber(
                  (index === 0
                    ? pool.pool.protocolFees.feeA
                    : pool.pool.protocolFees.feeB
                  ).value.toString(),
                )
                  .times(appData.bankMap[coinType].bTokenExchangeRate)
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
