import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import BigNumber from "bignumber.js";
import { Loader2 } from "lucide-react";

import { Token, formatToken, getToken } from "@suilend/sui-fe";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/sui-fe-next";
import useCoinMetadataMap from "@suilend/sui-fe-next/hooks/useCoinMetadataMap";
import useIsTouchscreen from "@suilend/sui-fe-next/hooks/useIsTouchscreen";

import CoinInput, { getCoinInputId } from "@/components/CoinInput";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import { useUserContext } from "@/contexts/UserContext";
import useCachedUsdPrices from "@/hooks/useCachedUsdPrices";
import { formatTextInputValue } from "@/lib/format";
import { showSuccessTxnToast } from "@/lib/toasts";

export default function MintPage() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useUserContext();

  const isTouchscreen = useIsTouchscreen();

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

  // State - value
  const [value, setValue] = useState<string>("");

  const onValueChange = (_value: string, _coinType?: string) => {
    const formattedValue = formatTextInputValue(
      _value,
      (_coinType ?? coinType)
        ? coinMetadataMap![_coinType ?? coinType].decimals
        : 9,
    );

    const newValue = formattedValue;
    setValue(newValue);
  };

  // Cached USD prices - current
  const { cachedUsdPricesMap, fetchCachedUsdPrice } = useCachedUsdPrices([]);

  const cachedUsdValue = useMemo(
    () =>
      coinType !== ""
        ? cachedUsdPricesMap[coinType] === undefined
          ? undefined
          : new BigNumber(value || 0).times(cachedUsdPricesMap[coinType])
        : "",
    [coinType, cachedUsdPricesMap, value],
  );

  // Select
  const tokens = useMemo(
    () =>
      Object.entries(coinMetadataMap ?? {})
        .filter(([coinType]) => treasuryCapIdMap?.[coinType])
        .map(([coinType, coinMetadata]) => getToken(coinType, coinMetadata))
        .sort(
          (a, b) => (a.symbol.toLowerCase() < b.symbol.toLowerCase() ? -1 : 1), // Sort by symbol (ascending)
        ),
    [coinMetadataMap, treasuryCapIdMap],
  );

  const onSelectToken = (token: Token) => {
    const newCoinType = token.coinType;

    if (cachedUsdPricesMap[newCoinType] === undefined)
      fetchCachedUsdPrice(newCoinType);

    setCoinType(newCoinType);
    onValueChange(value, newCoinType);

    setTimeout(() => {
      document.getElementById(getCoinInputId(newCoinType))?.focus();
    }, 500);
  };

  // Submit
  const reset = () => {
    // State
    setCoinType("");
    setTimeout(() => coinInputRef.current?.focus(), 100); // After dialog is closed

    setValue("");
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (isSubmitting) return { isLoading: true, isDisabled: true };

    if (coinType === "") return { isDisabled: true, title: "Select a token" };
    if (value === "") return { isDisabled: true, title: "Enter an amount" };
    if (new BigNumber(value).lt(0))
      return { isDisabled: true, title: "Enter a +ve amount" };
    if (new BigNumber(value).eq(0))
      return { isDisabled: true, title: "Enter a non-zero amount" };

    return {
      isDisabled: false,
      title: "Mint",
    };
  })();

  const onSubmitClick = async () => {
    if (submitButtonState.isDisabled) return;

    try {
      if (!address) throw new Error("Wallet not connected");

      setIsSubmitting(true);

      // Get supply
      const supply = new BigNumber(
        (await suiClient.getTotalSupply({ coinType })).value,
      );
      const newSupply = supply.plus(new BigNumber(value || 0));

      // Mint
      const token = getToken(coinType, coinMetadataMap![coinType]);

      const transaction = new Transaction();

      const mintedCoin = transaction.moveCall({
        target: "0x2::coin::mint",
        arguments: [
          transaction.object(treasuryCapIdMap[coinType]),
          transaction.pure.u64(
            BigInt(
              new BigNumber(value || 0)
                .times(10 ** token.decimals)
                .integerValue(BigNumber.ROUND_DOWN)
                .toString(),
            ),
          ),
        ],
        typeArguments: [coinType],
      });
      transaction.transferObjects([mintedCoin], address);

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(
        `Minted ${formatToken(new BigNumber(value || 0), {
          dp: token.decimals,
          trimTrailingZeros: true,
        })} ${token.symbol}`,
        txUrl,
        {
          description: `New supply: ${formatToken(newSupply, {
            dp: token.decimals,
            trimTrailingZeros: true,
          })}`,
        },
      );
      reset();
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
          <div className="flex w-full flex-col gap-4">
            {/* Token */}
            <div className="flex w-full flex-col gap-3">
              <div className="flex flex-row items-center gap-2">
                <p className="text-p2 text-secondary-foreground">Token</p>

                {treasuryCapIdMap === undefined && (
                  <Loader2 className="h-4 w-4 animate-spin text-secondary-foreground" />
                )}
              </div>

              <CoinInput
                ref={coinInputRef}
                autoFocus={!isTouchscreen}
                token={
                  coinType !== ""
                    ? getToken(coinType, coinMetadataMap![coinType])
                    : undefined
                }
                value={value}
                usdValue={cachedUsdValue}
                onChange={onValueChange}
                tokens={tokens}
                onSelectToken={onSelectToken}
                isDisabled={treasuryCapIdMap === undefined}
              />
            </div>
          </div>

          <SubmitButton
            submitButtonState={submitButtonState}
            onClick={onSubmitClick}
          />
        </div>
      </div>
    </>
  );
}
