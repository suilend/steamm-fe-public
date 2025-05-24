import Image from "next/image";

import { CoinMetadata } from "@mysten/sui/client";
import BigNumber from "bignumber.js";

import { formatId, formatPrice, getToken } from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";
import { OracleInfo } from "@suilend/steamm-sdk";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
import {
  OracleType,
  getPythOracleUrl,
  parseOraclePriceIdentifier,
} from "@/lib/oracles";

interface OracleCardProps {
  pythPriceIdentifierSymbolMap: Record<string, string> | undefined;
  coinMetadataMap: Record<string, CoinMetadata>;
  coinTypes: string[];
  oracleInfo: OracleInfo;
  price: BigNumber;
}

export default function OracleCard({
  pythPriceIdentifierSymbolMap,
  coinMetadataMap,
  coinTypes,
  oracleInfo,
  price,
}: OracleCardProps) {
  const { explorer } = useSettingsContext();

  const priceIdentifier = parseOraclePriceIdentifier(oracleInfo);

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border p-4">
      {/* Top */}
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          {oracleInfo.oracleType === OracleType.PYTH && (
            <Image
              src={`${SUILEND_ASSETS_URL}/partners/Pyth.png`}
              alt="Pyth logo"
              width={24}
              height={24}
              quality={100}
            />
          )}
          {oracleInfo.oracleType === OracleType.SWITCHBOARD && (
            <Image
              src={`${SUILEND_ASSETS_URL}/partners/Switchboard.png`}
              alt="Switchboard logo"
              width={24}
              height={24}
              quality={100}
            />
          )}

          <Tooltip title={`0x${priceIdentifier}`}>
            <p className="text-h3 text-foreground">
              {formatId(`0x${priceIdentifier}`)}
            </p>
          </Tooltip>
        </div>

        {oracleInfo.oracleType === OracleType.PYTH &&
          (pythPriceIdentifierSymbolMap?.[priceIdentifier] === undefined ? (
            <Skeleton className="h-5 w-5" />
          ) : (
            <OpenUrlNewTab
              url={getPythOracleUrl(
                pythPriceIdentifierSymbolMap[priceIdentifier],
              )}
            />
          ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Parameter label="Index" isHorizontal>
          {oracleInfo.oracleIndex}
        </Parameter>

        <Parameter label="Symbol" isHorizontal>
          {pythPriceIdentifierSymbolMap?.[priceIdentifier] === undefined ? (
            <Skeleton className="h-[21px] w-24" />
          ) : (
            <p className="text-p2 text-foreground">
              {pythPriceIdentifierSymbolMap[priceIdentifier]}
            </p>
          )}
        </Parameter>

        <Parameter label="Price" isHorizontal>
          <p className="text-p2 text-foreground">{formatPrice(price)}</p>
        </Parameter>

        <Parameter label="coinTypes" isHorizontal>
          <div className="flex flex-col items-end gap-1">
            {coinTypes.map((coinType) => (
              <div key={coinType} className="flex flex-row items-center gap-2">
                <TokenLogo
                  token={getToken(coinType, coinMetadataMap[coinType])}
                  size={16}
                />

                {coinMetadataMap[coinType] === undefined ? (
                  <Skeleton className="h-[21px] w-12" />
                ) : (
                  <p className="flex text-p2 text-foreground">
                    {coinMetadataMap[coinType].symbol}
                  </p>
                )}

                <div className="flex flex-row items-center gap-1">
                  <CopyToClipboardButton value={coinType} />
                  <OpenUrlNewTab url={explorer.buildCoinUrl(coinType)} />
                </div>
              </div>
            ))}
          </div>

          {/* <div className="flex w-full flex-row items-center gap-2">
              <div className="flex-1">
                <TextInput className="h-8" value={""} onChange={() => {}} />
              </div>
  
              <button
                className="group flex h-6 w-[56px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
                disabled={
                  address !== ADMIN_ADDRESS || false || coinTypes.includes("")
                }
                // onClick={() => submitMinTokenBlockSize()}
              >
                {false ? (
                  <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
                ) : (
                  <p className="text-p3 text-button-2-foreground">Add</p>
                )}
              </button>
            </div> */}
        </Parameter>
      </div>
    </div>
  );
}
