import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Loader2 } from "lucide-react";

import { formatToken, getToken } from "@suilend/sui-fe";
import {
  showErrorToast,
  showSuccessToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";

import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import TokenSelectionDialog from "@/components/swap/TokenSelectionDialog";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { formatTextInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function MintPage() {
  const { suiClient } = useSettingsContext();
  const { account, address, signExecuteAndWaitForTransaction } =
    useWalletContext();
  const { appData } = useLoadedAppContext();
  const { balancesCoinMetadataMap, getBalance, refresh } = useUserContext();

  // TreasuryCap map
  const [treasuryCapIdMapMap, setTreasuryCapIdMapMap] = useState<
    Record<string, Record<string, string>>
  >({});
  const treasuryCapIdMap: Record<string, string> | undefined = useMemo(
    () => (!address ? {} : treasuryCapIdMapMap[address]),
    [address, treasuryCapIdMapMap],
  );

  const getOwnedObjects = useCallback(async () => {
    if (!address) return [];

    const allObjs = [];
    let cursor = null;
    let hasNextPage = true;
    while (hasNextPage) {
      const objs = await suiClient.getOwnedObjects({
        owner: address,
        cursor,
        options: { showType: true },
      });

      allObjs.push(...objs.data);
      cursor = objs.nextCursor;
      hasNextPage = objs.hasNextPage;
    }

    return allObjs;
  }, [address, suiClient]);

  const fetchTreasuryCapIdMap = useCallback(async () => {
    if (!address) return;

    try {
      const result: Record<string, string> = {};

      const allOwnedObjs = await getOwnedObjects();
      for (const ownedObj of allOwnedObjs) {
        if (
          !ownedObj.data?.type ||
          !ownedObj.data.type.startsWith("0x2::coin::TreasuryCap<")
        )
          continue;
        if (!ownedObj.data.objectId) continue;

        const coinType = ownedObj.data.type.split("<")[1].split(">")[0];
        if (!coinType) continue;

        result[coinType] = ownedObj.data.objectId;
      }

      setTreasuryCapIdMapMap((prev) => ({
        ...prev,
        [address]: result,
      }));
    } catch (err) {
      showErrorToast("Failed to fetch TreasuryCap id map", err as Error);
      console.error(err);
    }
  }, [getOwnedObjects, address]);

  const hasFetchedTreasuryCapIdMapRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    if (!address) return;

    if (hasFetchedTreasuryCapIdMapRef.current[address]) return;
    hasFetchedTreasuryCapIdMapRef.current[address] = true;

    fetchTreasuryCapIdMap();
  }, [address, fetchTreasuryCapIdMap]);

  const coinMetadataMap = useCoinMetadataMap(
    Object.keys(treasuryCapIdMap ?? {}),
  );

  // State - coinType
  const [coinType, setCoinType] = useState<string>("");
  const coinInputRef = useRef<HTMLInputElement>(null);

  const token =
    coinType !== ""
      ? getToken(coinType, (coinMetadataMap ?? {})[coinType])!
      : undefined;

  // State - amount
  const [value, setValue] = useState<string>("");

  const onValueChange = (_value: string, _coinType?: string) => {
    const formattedValue = formatTextInputValue(
      _value,
      (_coinType ?? coinType)
        ? (coinMetadataMap ?? {})[_coinType ?? coinType]!.decimals
        : 9,
    );
    setValue(formattedValue);
  };

  // Submit
  const reset = () => {
    // State
    setCoinType("");
    setValue("");
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    // Token
    if (token === undefined)
      return { isDisabled: true, title: "Select a token" };

    //

    return {
      isDisabled: false,
      title: "Mint",
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;
    if (token === undefined) return; // Should not happen

    try {
      if (!account?.publicKey || !address)
        throw new Error("Wallet not connected");

      setIsSubmitting(true);

      showSuccessToast(
        `Minted ${formatToken(new BigNumber(amount || 0), {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol}`,
      );
    } catch (err) {
      showErrorToast("Failed to mint", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsSubmitting(false);
      refresh();
    }
  };

  return (
    <>
      <Head>
        <title>STEAMM | Mint</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Mint</h1>
        </div>

        <div className="flex w-full flex-col gap-6">
          <div
            className={cn(
              "flex w-full flex-col gap-4",
              false && "pointer-events-none",
            )}
          >
            {/* Token */}
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-row items-center gap-2">
                <p className="text-p2 text-secondary-foreground">Token</p>

                {treasuryCapIdMap === undefined && (
                  <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
                )}
              </div>

              <CoinInput
                // ref={baseAssetCoinInputRef}
                // autoFocus={!isTouchscreen}
                token={token}
                value={values[0]}
                usdValue={cachedUsdValues[0]}
                onChange={(value) => onValueChange(value, 0)}
                onMaxAmountClick={
                  coinTypes[0] !== "" ? () => onBalanceClick(0) : undefined
                }
                tokens={baseTokens}
                onSelectToken={(token) => onSelectToken(token, 0)}
              />

              <TokenSelectionDialog
                triggerClassName="w-max px-3 border rounded-md"
                triggerIconSize={16}
                triggerLabelSelectedClassName="!text-p2"
                triggerLabelUnselectedClassName="!text-p2"
                triggerChevronClassName="!h-4 !w-4 !ml-0 !mr-0"
                token={token}
                tokens={tokens}
                onSelectToken={(token) => setCoinType(token.coinType)}
                isDisabled={treasuryCapIdMap === undefined}
              />
            </div>

            {/* Amount */}
          </div>

          <div className="flex w-full flex-col gap-1">
            <SubmitButton
              submitButtonState={submitButtonState}
              onClick={onSubmitClick}
            />
          </div>
        </div>
      </div>
    </>
  );
}
