import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { Loader2 } from "lucide-react";

import { API_URL } from "@suilend/frontend-sui";
import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";
import { ADMIN_ADDRESS, addOracleToRegistry } from "@suilend/steamm-sdk";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import Tooltip from "@/components/Tooltip";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import {
  OracleType,
  oracleTypeMap,
  parseOraclePriceIdentifier,
} from "@/lib/oracles";
import { showSuccessTxnToast } from "@/lib/toasts";
import { cn } from "@/lib/utils";

export default function AddOracleCard() {
  const { explorer } = useSettingsContext();
  const { steammClient, appData } = useLoadedAppContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { refresh } = useUserContext();

  const [oracleType, setOracleType] = useState<OracleType>(OracleType.PYTH);
  const [priceIdentifier, setPriceIdentifier] = useState<string>("");

  const [isAddingOracle, setIsAddingOracle] = useState<boolean>(false);

  const submitAddOracle = async () => {
    if (address !== ADMIN_ADDRESS) return;

    try {
      setIsAddingOracle(true);

      const transaction = new Transaction();

      const priceInfoObjectId =
        await steammClient.pythClient.getPriceFeedObjectId(priceIdentifier);
      if (!priceInfoObjectId)
        throw new Error(
          "Unable to find price info object id for price identifier",
        );

      const oracleAdminCapId =
        process.env.NEXT_PUBLIC_STEAMM_USE_BETA_MARKET === "true"
          ? "0x7b077b66c8bffd20cfc2f006254bf5f60dc74f4157a09ea5c967c5bf2a4e83df"
          : "0x4c2fec4369876ec2bd2c74c71bd3dcecf8c5544bbbeaf79b19c15814c1e9b6a8";

      // TODO: Add support for Switchboard oracle type
      await addOracleToRegistry(steammClient, transaction, {
        type: oracleType as any,
        adminCap: oracleAdminCapId,
        priceInfoObj: priceInfoObjectId,
      });

      const res = await signExecuteAndWaitForTransaction(transaction);
      const txUrl = explorer.buildTxUrl(res.digest);

      showSuccessTxnToast(`Added ${oracleTypeMap[oracleType]} oracle`, txUrl, {
        description: `Price identifier: ${priceIdentifier}`,
      });

      // Reset
      setPriceIdentifier("");

      // Clear cache
      try {
        await fetch(`${API_URL}/steamm/oracles/clear-cache`);
      } catch (err) {
        showErrorToast("Failed to clear cache", err as Error);
        console.error(err);
      }
    } catch (err) {
      showErrorToast("Failed to add oracle", err as Error, undefined, true);
      console.error(err);
    } finally {
      setIsAddingOracle(false);
      refresh();
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-md border p-4">
      {/* Top */}
      <p className="text-h3 text-foreground">Add oracle</p>

      <div className="flex w-full flex-col items-end gap-2">
        <Parameter
          labelContainerClassName="items-center h-8"
          label="Type"
          isHorizontal
        >
          <div className="flex flex-row gap-1">
            {Object.values(OracleType).map((_oracleType) => {
              return (
                <div key={_oracleType} className="w-max">
                  <Tooltip
                    title={
                      [OracleType.SWITCHBOARD].includes(_oracleType)
                        ? "Not implemented"
                        : undefined
                    }
                  >
                    <div className="w-max">
                      <button
                        key={_oracleType}
                        className={cn(
                          "group flex h-8 flex-row items-center rounded-md border px-3 transition-colors disabled:pointer-events-none disabled:opacity-50",
                          _oracleType === oracleType
                            ? "cursor-default bg-button-1"
                            : "hover:bg-border/50",
                        )}
                        onClick={() => setOracleType(_oracleType)}
                        disabled={[OracleType.SWITCHBOARD].includes(
                          _oracleType,
                        )}
                      >
                        <p
                          className={cn(
                            "!text-p2 transition-colors",
                            _oracleType === oracleType
                              ? "text-button-1-foreground"
                              : "text-secondary-foreground group-hover:text-foreground",
                          )}
                        >
                          {oracleTypeMap[_oracleType]}
                        </p>
                      </button>
                    </div>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </Parameter>

        <Parameter
          labelContainerClassName="flex-1 items-center h-8"
          label="Price identifier"
          isHorizontal
        >
          <div className="flex-1">
            <TextInput
              className="h-8"
              value={priceIdentifier}
              onChange={setPriceIdentifier}
            />
          </div>
        </Parameter>

        <button
          className="group flex h-6 w-[40px] flex-row items-center justify-center rounded-md bg-button-2 px-2 transition-colors hover:bg-button-2/80 disabled:pointer-events-none disabled:opacity-50"
          disabled={
            address !== ADMIN_ADDRESS ||
            isAddingOracle ||
            priceIdentifier === "" ||
            Object.values(appData.oracleIndexOracleInfoPriceMap).some(
              ({ oracleInfo }) =>
                oracleInfo.oracleType === oracleType &&
                (parseOraclePriceIdentifier(oracleInfo) === priceIdentifier ||
                  `0x${parseOraclePriceIdentifier(oracleInfo)}` ===
                    priceIdentifier),
            )
          }
          onClick={() => submitAddOracle()}
        >
          {isAddingOracle ? (
            <Loader2 className="h-4 w-4 animate-spin text-button-2-foreground" />
          ) : (
            <p className="text-p3 text-button-2-foreground">Add</p>
          )}
        </button>
      </div>
    </div>
  );
}
