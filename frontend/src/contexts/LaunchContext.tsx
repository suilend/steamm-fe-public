import { createContext, useContext, useState } from "react";

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

import { createPool } from "@/components/admin/pools/CreatePoolCard";
import { useLoadedAppContext } from "@/contexts/AppContext";
import { useUserContext } from "@/contexts/UserContext";
import { showSuccessTxnToast } from "@/lib/toasts";
import { QuoterId } from "@/lib/types";
import { useLocalStorage } from "usehooks-ts";

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
  Error = 5,
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

  // Token creation results
  tokenType: string | null;
  treasuryCapId: string | null;

  // Pool creation results
  poolId: string | null;

  // Error
  error: Error | null;

  // Transaction digest
  transactionDigests: {
    [key: string]: string;
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
  tokenDecimals: 9,
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
  treasuryCapId: null,

  // Pool creation results
  poolId: null,

  // Error
  error: null,

  // Transaction digest
  transactionDigests: {},
};

type LaunchContextType = {
  config: LaunchConfig;
  setConfig: (config: LaunchConfig) => void;
  launchToken: () => Promise<CreateTokenResult | null>;
};

export const LaunchContext = createContext<LaunchContextType>({
  config: DEFAULT_CONFIG,
  setConfig: () => {},
  launchToken: async () => null,
});
export const useLaunch = () => useContext(LaunchContext);

const LaunchContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [config, setConfig] = useLocalStorage<LaunchConfig>(
    "launch-config",
    DEFAULT_CONFIG,
  );
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();
  const { steammClient, banksData } = useLoadedAppContext();
  const { balancesCoinMetadataMap } = useUserContext();
  const setCreationStatus = (status: TokenCreationStatus) => {
    setConfig({ ...config, status });
  };
  const setCreateError = (error: Error | null) => {
    setConfig({ ...config, error });
  };
  const setTransactionDigest = (key: string, digest: string) => {
    setConfig({ ...config, transactionDigests: { ...config.transactionDigests, [key]: digest } });
  };

  const launchToken = async (): Promise<CreateTokenResult | null> => {
    if (!address) {
      showErrorToast(
        "Wallet not connected",
        new Error("Please connect your wallet"),
        undefined,
        true,
      );
      return null;
    }

    setCreateError(null);

    try {
      setCreationStatus(TokenCreationStatus.Publishing);

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
      setTransactionDigest("publish", res.digest);

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

      // Mint initial supply if specified
      if (config.initialSupply && parseFloat(config.initialSupply) > 0) {
        try {
          // Update status to minting
          setCreationStatus(TokenCreationStatus.Minting);

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
              mintTransaction.object(treasuryCapChange.objectId),
              mintTransaction.pure.u64(initialSupplyAmount.toString()),
            ],
            typeArguments: [tokenType],
          });

          // Transfer the minted coins to the creator's address
          mintTransaction.transferObjects([mintedCoin], address);

          // Execute the mint transaction
          const mintRes =
            await signExecuteAndWaitForTransaction(mintTransaction);

          // Update transaction digest to the latest transaction
          setTransactionDigest("mint", mintRes.digest);

          // Update status to success
          setCreationStatus(TokenCreationStatus.Success);

          // Show success toast with updated information
          const txUrl = explorer.buildTxUrl(mintRes.digest);
          showSuccessTxnToast(
            `Token ${config.tokenName} (${config.tokenSymbol}) created and ${config.initialSupply} tokens minted`,
            txUrl,
            {
              description: `Created with ${config.tokenDecimals} decimals`,
            },
          );

          return {
            digest: mintRes.digest,
            tokenType,
            treasuryCapId: treasuryCapChange.objectId,
            coinMetadataId: coinMetadataChange.objectId,
            poolId: "pending", // Will be updated later
          };
        } catch (mintErr) {
          // If minting fails, we still return the token creation result
          // but show a warning toast
          showErrorToast(
            "Token created but failed to mint initial supply",
            mintErr as Error,
            undefined,
            true,
          );

          // Update status to error
          setCreationStatus(TokenCreationStatus.Error);
          setCreateError(mintErr as Error);

          // Show partial success toast
          const txUrl = explorer.buildTxUrl(res.digest);
          showSuccessTxnToast(
            `Token ${config.tokenName} (${config.tokenSymbol}) created successfully`,
            txUrl,
            {
              description: `Created with ${config.tokenDecimals} decimals, but initial supply minting failed`,
            },
          );
        }
      } else {
        // Show success toast
        const txUrl = explorer.buildTxUrl(res.digest);
        showSuccessTxnToast(
          `Token ${config.tokenName} (${config.tokenSymbol}) created successfully`,
          txUrl,
          {
            description: `Created with ${config.tokenDecimals} decimals`,
          },
        );
      }

      try {
        await createPool(
          banksData!,
          QuoterId.CPMM,
          0.3,
          [coinMetadataChange.objectId, coinMetadataChange.objectId],
          address!,
          signExecuteAndWaitForTransaction,
          explorer,
          balancesCoinMetadataMap!,
          suiClient,
          steammClient,
          ["1_000_000_000", "1"],
        );

      } catch (error) {
        console.error("Error creating pool:", error);
        // Pool creation error isn't critical, so we continue
      }

      // Return the result with token information
      return {
        digest: res.digest,
        tokenType,
        treasuryCapId: treasuryCapChange.objectId,
        coinMetadataId: coinMetadataChange.objectId,
        poolId: "pending", // Will be updated later
      };
    } catch (err) {
      const error = err as Error;
      showErrorToast("Failed to create token", error, undefined, true);
      console.error(err);
      Sentry.captureException(err);
      setCreateError(error);
      setCreationStatus(TokenCreationStatus.Error);
      return null;
    }
  };

  const contextValue: LaunchContextType = {
    config,
    setConfig,
    launchToken,
  };

  return (
    <LaunchContext.Provider value={contextValue}>
      {children}
    </LaunchContext.Provider>
  );
};

export default LaunchContextProvider;
