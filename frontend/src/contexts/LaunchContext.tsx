import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { bcs } from "@mysten/bcs";
import init, * as template from "@mysten/move-bytecode-template";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import * as Sentry from "@sentry/nextjs";

import {
  showErrorToast,
  useSettingsContext,
  useWalletContext,
} from "@suilend/frontend-sui-next";

import { createPool } from "@/components/launch/launch";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { QuoterId } from "@/lib/types";
import { useLocalStorage } from "usehooks-ts";


const SUI_COIN_TYPE =
  "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI";

export enum LaunchStep {
  Start = -1,
  Config = 0,
  Deploy = 1,
  Complete = 2,
}

export enum TokenCreationStatus {
  Pending = 0,
  Publishing = 1,
  Minting = 2,
  Pooling = 3,
  Success = 4,
}

export type LaunchConfig = {
  // Wizard config date
  step: LaunchStep;
  lastCompletedStep: LaunchStep;
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  tokenDecimals: number;
  initialSupply: string;
  maxSupply: string;
  isBurnable: boolean;
  isMintable: boolean;
  isPausable: boolean;
  isUpgradeable: boolean;
  iconUrl: string | null;

  iconFileName: string | null;

  // Token creation status
  status: TokenCreationStatus;

  // Pool creation results
  poolUrl: string | null;

  // Error
  error: string | null;

  // Transaction data
  tokenType: string | null;
  treasuryCapChange: {
    objectId: string;
    objectType: string;
  } | null;
  coinMetadataChange: {
    objectId: string;
    objectType: string;
  } | null;

  // Transaction digest
  transactionDigests: {
    [key: string]: string[];
  };
};

// Initialize the WebAssembly module
let moduleInitialized = false;
let moduleInitPromise: Promise<void> | null = null;

async function ensureModuleInitialized() {
  if (moduleInitialized) return;

  if (!moduleInitPromise) {
    moduleInitPromise = (async () => {
      try {
        console.log("Initializing WASM module...");
        await init("/move_bytecode_template_bg.wasm");
        console.log("WASM module initialized successfully");
        moduleInitialized = true;
      } catch (err) {
        console.error("Failed to initialize WASM module:", err);
        // Reset the promise so we can try again
        moduleInitPromise = null;
        throw new Error(
          "Failed to initialize token creation module. Please refresh the page and try again.",
        );
      }
    })();
  }

  return moduleInitPromise;
}

// Get the update_identifiers and update_constants functions from the template
const { update_identifiers, update_constants } = template;

export interface CreateTokenResult {
  digest: string;
  tokenType: string;
  treasuryCapId: string;
  coinMetadataId: string;
  poolId: string;
}

// Helper function to generate a token bytecode using a template
const generateTokenBytecode = async (
  params: LaunchConfig,
): Promise<Uint8Array> => {
  try {
    // Ensure the WASM module is initialized before using any of its functions
    await ensureModuleInitialized();

    // Create sanitized module and type names
    const moduleName = params.tokenSymbol
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");
    const typeName = params.tokenSymbol
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_");

    // Base64 encoded bytecode template for a standard coin module
    const bytecode = Buffer.from(
      "oRzrCwYAAAAKAQAMAgweAyonBFEIBVlMB6UBywEI8AJgBtADXQqtBAUMsgQoABABCwIGAhECEgITAAICAAEBBwEAAAIADAEAAQIDDAEAAQQEAgAFBQcAAAkAAQABDwUGAQACBwgJAQIDDAUBAQwDDQ0BAQwEDgoLAAUKAwQAAQQCBwQMAwICCAAHCAQAAQsCAQgAAQoCAQgFAQkAAQsBAQkAAQgABwkAAgoCCgIKAgsBAQgFBwgEAgsDAQkACwIBCQABBggEAQUBCwMBCAACCQAFDENvaW5NZXRhZGF0YQZPcHRpb24IVEVNUExBVEULVHJlYXN1cnlDYXAJVHhDb250ZXh0A1VybARjb2luD2NyZWF0ZV9jdXJyZW5jeQtkdW1teV9maWVsZARpbml0FW5ld191bnNhZmVfZnJvbV9ieXRlcwZvcHRpb24TcHVibGljX3NoYXJlX29iamVjdA9wdWJsaWNfdHJhbnNmZXIGc2VuZGVyBHNvbWUIdGVtcGxhdGUIdHJhbnNmZXIKdHhfY29udGV4dAN1cmwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAQkKAgUEVE1QTAoCDg1UZW1wbGF0ZSBDb2luCgIaGVRlbXBsYXRlIENvaW4gRGVzY3JpcHRpb24KAiEgaHR0cHM6Ly9leGFtcGxlLmNvbS90ZW1wbGF0ZS5wbmcAAgEIAQAAAAACEgsABwAHAQcCBwMHBBEGOAAKATgBDAILAS4RBTgCCwI4AwIA=",
      "base64",
    );

    // Update module and type names in the bytecode
    let updated = update_identifiers(bytecode, {
      TEMPLATE: typeName,
      template: moduleName,
    });

    // Update token symbol
    updated = update_constants(
      updated,
      bcs.string().serialize(params.tokenSymbol).toBytes(),
      bcs.string().serialize("TMPL").toBytes(),
      "Vector(U8)",
    );

    // Update token name
    updated = update_constants(
      updated,
      bcs.string().serialize(params.tokenName).toBytes(),
      bcs.string().serialize("Template Coin").toBytes(),
      "Vector(U8)",
    );

    // Update token description
    updated = update_constants(
      updated,
      bcs
        .string()
        .serialize(params.tokenDescription || "")
        .toBytes(),
      bcs.string().serialize("Template Coin Description").toBytes(),
      "Vector(U8)",
    );

    // Use custom icon URL if provided, otherwise use default
    const iconUrl =
      params.iconUrl || "https://steamm-assets.s3.amazonaws.com/token-icon.png";
    updated = update_constants(
      updated,
      bcs.string().serialize(iconUrl).toBytes(),
      bcs.string().serialize("https://example.com/template.png").toBytes(),
      "Vector(U8)",
    );

    return updated;
  } catch (error) {
    console.error("Error generating token bytecode:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate token bytecode: ${error.message}`);
    } else {
      throw new Error(`Failed to generate token bytecode: ${String(error)}`);
    }
  }
};

export const DEFAULT_CONFIG: LaunchConfig = {
  status: TokenCreationStatus.Pending,
  step: LaunchStep.Config,
  lastCompletedStep: LaunchStep.Start,
  tokenName: "",
  tokenSymbol: "",
  tokenDescription: "",
  tokenDecimals: 6,
  initialSupply: "1000000000",
  maxSupply: "1000000000",
  isBurnable: false,
  isMintable: false,
  isPausable: false,
  isUpgradeable: false,
  iconUrl: null,
  iconFileName: null,

  // Token creation results
  tokenType: null,
  treasuryCapChange: null,
  coinMetadataChange: null,

  // Pool creation results
  poolUrl: null,

  // Error
  error: null,

  // Transaction digest
  transactionDigests: {},
};

type LaunchContextType = {
  config: LaunchConfig;
  setConfig: (config: LaunchConfig) => void;
  launchToken: () => Promise<LaunchConfig | null>;
  txnInProgress: boolean;
  setTxnInProgress: (txnInProgress: boolean) => void;
};

export const LaunchContext = createContext<LaunchContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  launchToken: async () => null,
  txnInProgress: false,
  setTxnInProgress: () => {},
});
export const useLaunch = () => useContext(LaunchContext);

const LaunchContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [configRaw, setConfig] = useLocalStorage<LaunchConfig>(
    "launch-config",
    DEFAULT_CONFIG,
  );
  const [ tempConfig, setTempConfig ] = useState<LaunchConfig | null>(null);
  const config = tempConfig ?? configRaw;
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, banksData } = useLoadedAppContext();
  const [txnInProgress, setTxnInProgress] = useState(false);
  const { balancesCoinMetadataMap, refreshRawBalancesMap } = useUserContext();
  const setConfigWrap = useCallback((update: Partial<LaunchConfig>) => {
    setConfig(prev => ({...prev, ...update}));
  }, [setConfig]);

  useEffect(() => {
    if (config.lastCompletedStep === LaunchStep.Complete) {
      setTempConfig(configRaw);
      setConfig(DEFAULT_CONFIG);
    } else {
      setTempConfig(null);
    }
  }, [config.lastCompletedStep]);
  
  const launchToken = async (): Promise<LaunchConfig | null> => {
    const pendingUpdates: Partial<LaunchConfig> = {
      error: null,
    };
    setTxnInProgress(true);
    if (!address) {
      showErrorToast(
        "Wallet not connected",
        new Error("Please connect your wallet"),
        undefined,
        true,
      );
      return null;
    }
    
    const mergedConfig = {
      ...config,
      ...pendingUpdates,
    };
    // Publish Step
    try {
      if (!mergedConfig.tokenType || !mergedConfig.treasuryCapChange || !mergedConfig.coinMetadataChange) {
        setConfigWrap({status: TokenCreationStatus.Publishing});

        // Preemptively initialize the WASM module at the start of the function
        await ensureModuleInitialized();

        // Generate token bytecode using our template
        const bytecode = await generateTokenBytecode(config);

        // Create the transaction to publish the module
        const transaction = new Transaction();

        // Publish the module
        const [upgradeCap] = transaction.publish({
          modules: [[...bytecode]],
          dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
        });

        // Transfer the upgrade cap to the sender
        transaction.transferObjects(
          [upgradeCap],
          transaction.pure.address(address),
        );

        // Execute the transaction
        const res = await signExecuteAndWaitForTransaction(transaction);

        // Extract the TreasuryCap and CoinMetadata IDs from the transaction results
        const treasuryCapChange = res.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            change.objectType.includes("TreasuryCap"),
        );

        const coinMetadataChange = res.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            change.objectType.includes("CoinMetadata"),
        );

        if (
          !treasuryCapChange ||
          treasuryCapChange.type !== "created" ||
          !coinMetadataChange ||
          coinMetadataChange.type !== "created"
        ) {
          throw new Error(
            "Failed to find created token objects in transaction results",
          );
        }

        // Extract the token type from the TreasuryCap object type
        const tokenType =
          treasuryCapChange.objectType.split("<")[1]?.split(">")[0] || "";
        mergedConfig.tokenType = tokenType;
        mergedConfig.treasuryCapChange = treasuryCapChange;
        mergedConfig.coinMetadataChange = coinMetadataChange;
        mergedConfig.status = TokenCreationStatus.Minting;
        mergedConfig.transactionDigests = {
          ...mergedConfig.transactionDigests,
          [TokenCreationStatus.Publishing]: [res.digest],
        };
        setConfigWrap({
            status: TokenCreationStatus.Minting,
            transactionDigests: {
              ...mergedConfig.transactionDigests,
              [TokenCreationStatus.Publishing]: [res.digest],
            },
            tokenType: tokenType,
            treasuryCapChange: treasuryCapChange,
            coinMetadataChange: coinMetadataChange,
          });
      }
      // Mint Step

      // Mint initial supply if specified
      if (config.initialSupply && parseFloat(config.initialSupply) > 0 && mergedConfig.tokenType && mergedConfig.treasuryCapChange && mergedConfig.coinMetadataChange && mergedConfig.status <= TokenCreationStatus.Minting) {

          // Create a new transaction for minting initial supply
          const mintTransaction = new Transaction();

          // Convert initialSupply to the smallest denomination based on decimals
          const initialSupplyAmount = BigInt(
            Math.floor(
              parseFloat(config.initialSupply) *
                Math.pow(10, config.tokenDecimals),
            ),
          );

          // Create mint transaction using the standard coin::mint function
          // and providing our token type as a type argument
          const mintedCoin = mintTransaction.moveCall({
            target: `0x2::coin::mint`,
            arguments: [
              mintTransaction.object(mergedConfig.treasuryCapChange.objectId),
              mintTransaction.pure.u64(initialSupplyAmount.toString()),
            ],
            typeArguments: [mergedConfig.tokenType],
          });

          // Transfer the minted coins to the creator's address
          mintTransaction.transferObjects([mintedCoin], address);

          // Execute the mint transaction
          const mintRes =
            await signExecuteAndWaitForTransaction(mintTransaction);

          mergedConfig.status = TokenCreationStatus.Publishing;
          mergedConfig.transactionDigests = {
            ...mergedConfig.transactionDigests,
            [TokenCreationStatus.Minting]: [mintRes.digest],
          };
          setConfigWrap({
            status: TokenCreationStatus.Pooling,
            transactionDigests: {
              ...mergedConfig.transactionDigests,
              [TokenCreationStatus.Minting]: [mintRes.digest],
            },
          });
      }


      // After minting and before calling createPool
      let newTokenMetadata = balancesCoinMetadataMap?.[mergedConfig.tokenType] ?? null;
      if (!newTokenMetadata) {
        // Fetch from chain if not present
        newTokenMetadata = await suiClient.getCoinMetadata({ coinType: mergedConfig.tokenType });
        // Optionally, update your balancesCoinMetadataMap here if needed
      }

      if (!newTokenMetadata) {
        throw new Error("Failed to fetch token metadata");
      }

      if (mergedConfig.coinMetadataChange) {
        const res = await createPool(
          banksData!,
          QuoterId.CPMM,
          0.3,
          [mergedConfig.tokenType, SUI_COIN_TYPE],
          address!,
          signExecuteAndWaitForTransaction,
          explorer,
          {
            ...balancesCoinMetadataMap,
            [mergedConfig.tokenType]: newTokenMetadata,
          },
          suiClient,
          steammClient,
          [(Math.floor(Number(mergedConfig.initialSupply) * 0.1)).toString(), (10 ** -9).toString()],
        );

        mergedConfig.status = TokenCreationStatus.Success;
        mergedConfig.transactionDigests = {
          ...mergedConfig.transactionDigests,
          [TokenCreationStatus.Pooling]: res.txnDigests,
        };
        mergedConfig.step = LaunchStep.Complete;
        mergedConfig.lastCompletedStep = LaunchStep.Complete;
        mergedConfig.poolUrl = res.poolUrl;
        setConfigWrap({
          status: TokenCreationStatus.Success,
          step: LaunchStep.Complete,
          lastCompletedStep: LaunchStep.Complete,
          poolUrl: res.poolUrl,
          transactionDigests: {
            ...mergedConfig.transactionDigests,
            [TokenCreationStatus.Pooling]: res.txnDigests,
          },
        });
      }

      // Return the result with token information
      return mergedConfig;
    } catch (err) {
      const error = err as any;
      console.error(error);
      showErrorToast("Failed to create token", new Error(error?.shape?.message ?? error), undefined, true);
      console.error(err);
      Sentry.captureException(err);
      mergedConfig.error = error?.shape?.message ?? error?.message ?? error;
      setConfigWrap({
        error: error?.shape?.message ?? error?.message ?? error,
      });
      return null;
    } finally {
      setTxnInProgress(false);
    }
  };

  const contextValue: LaunchContextType = {
    config,
    setConfig,
    launchToken,
    txnInProgress,
    setTxnInProgress,
  };

  return (
    <LaunchContext.Provider value={contextValue}>
      {children}
    </LaunchContext.Provider>
  );
};

export default LaunchContextProvider;
