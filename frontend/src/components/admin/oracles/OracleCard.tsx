import BigNumber from "bignumber.js";

import { OracleInfo } from "@suilend/steamm-sdk";
import { formatId, formatPrice, getToken } from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Parameter from "@/components/Parameter";
import PythLogo from "@/components/PythLogo";
import SwitchboardLogo from "@/components/SwitchboardLogo";
import TokenLogo from "@/components/TokenLogo";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import {
  OracleType,
  getPythOracleUrl,
  parseOraclePriceIdentifier,
} from "@/lib/oracles";

interface OracleCardProps {
  coinTypes: string[];
  oracleInfo: OracleInfo;
  price: BigNumber;
}

export default function OracleCard({
  coinTypes,
  oracleInfo,
  price,
}: OracleCardProps) {
  const { explorer } = useSettingsContext();
  const { appData } = useLoadedAppContext();

  const priceIdentifier = parseOraclePriceIdentifier(oracleInfo);

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border p-4">
      {/* Top */}
      <div className="flex w-full flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          {oracleInfo.oracleType === OracleType.PYTH ? (
            <PythLogo size={24} />
          ) : oracleInfo.oracleType === OracleType.SWITCHBOARD ? (
            <SwitchboardLogo size={24} />
          ) : null}

          <Tooltip title={`0x${priceIdentifier}`}>
            <p className="text-h3 text-foreground">
              {formatId(`0x${priceIdentifier}`)}
            </p>
          </Tooltip>
        </div>

        {oracleInfo.oracleType === OracleType.PYTH ? (
          <OpenUrlNewTab
            url={getPythOracleUrl(
              appData.pythPriceIdentifierSymbolMap[priceIdentifier],
            )}
            tooltip="Open on Pyth"
          />
        ) : oracleInfo.oracleType === OracleType.SWITCHBOARD ? (
          <></> // TODO
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-2">
        <Parameter label="Index" isHorizontal>
          {oracleInfo.oracleIndex}
        </Parameter>

        <Parameter label="Symbol" isHorizontal>
          <p className="text-p2 text-foreground">
            {appData.pythPriceIdentifierSymbolMap[priceIdentifier]}
          </p>
        </Parameter>

        <Parameter label="Price" isHorizontal>
          <p className="text-p2 text-foreground">{formatPrice(price)}</p>
        </Parameter>

        <Parameter className="items-start" label="coinTypes" isHorizontal>
          <div className="flex flex-col items-end gap-1">
            {coinTypes.map((coinType) => (
              <div key={coinType} className="flex flex-row items-center gap-2">
                <TokenLogo
                  token={getToken(coinType, appData.coinMetadataMap[coinType])}
                  size={16}
                />

                <p className="flex text-p2 text-foreground">
                  {appData.coinMetadataMap[coinType].symbol}
                </p>

                <div className="flex flex-row items-center gap-1">
                  <CopyToClipboardButton value={coinType} />
                  <OpenUrlNewTab
                    url={explorer.buildCoinUrl(coinType)}
                    tooltip={`Open on ${explorer.name}`}
                  />
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
