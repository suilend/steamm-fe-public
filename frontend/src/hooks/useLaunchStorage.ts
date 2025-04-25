import { useEffect, useState } from "react";

// Define all storage keys as constants to prevent typos
export const STORAGE_KEYS = {
  // Flow control
  CURRENT_STEP: "launchCurrentStep",
  COMPLETED_STEPS: "launchCompletedSteps",
  IS_RESUMED: "launchIsResumed",

  // Token basics
  TOKEN_NAME: "launchTokenName",
  TOKEN_SYMBOL: "launchTokenSymbol",
  TOKEN_DESCRIPTION: "launchTokenDescription",
  INITIAL_SUPPLY: "launchInitialSupply",

  // Token options
  MAX_SUPPLY: "launchMaxSupply",
  IS_BURNABLE: "launchIsBurnable",
  IS_MINTABLE: "launchIsMintable",
  IS_PAUSABLE: "launchIsPausable",
  IS_UPGRADEABLE: "launchIsUpgradeable",

  // Token creation results
  TOKEN_TYPE: "launchTokenType",
  TREASURY_CAP_ID: "launchTreasuryCapId",

  // Pool creation results
  POOL_ID: "launchPoolId",
  POOL_ADDRESS: "launchPoolAddress",
  POOL_NAME: "launchPoolName",

  // Pool form data
  POOL_PREFILLED: "poolPrefilled",
  POOL_COIN_TYPES: "poolCoinTypes",
  POOL_VALUES: "poolValues",
  POOL_QUOTER_ID: "poolQuoterId",
  POOL_FEE_TIER: "poolFeeTier",
  POOL_FORM_VALUES: "poolFormValues",
  POOL_SELECTED_COIN_TYPES: "poolSelectedCoinTypes"
};

// Define the shape of our launch data
export interface LaunchStorageData {
  // Flow control
  currentStep: number;
  completedSteps: number[];
  isResumed: boolean;

  // Token basics
  tokenName: string;
  tokenSymbol: string;
  tokenDescription: string;
  initialSupply: string;

  // Token options
  maxSupply: string;
  isBurnable: boolean;
  isMintable: boolean;
  isPausable: boolean;
  isUpgradeable: boolean;

  // Token creation results
  tokenType: string | null;
  treasuryCapId: string | null;

  // Pool creation results
  poolId: string | null;
  poolAddress: string | null;
  poolName: string | null;

  // Pool form data
  poolPrefilled: boolean;
  poolCoinTypes: [string, string] | null;
  poolValues: [string, string] | null;
  poolQuoterId: string | null;
  poolFeeTier: string | null;
  poolFormValues: Record<string, any> | null;
  poolSelectedCoinTypes: string[] | null;
}

// Default values for a new launch session
export const DEFAULT_LAUNCH_DATA: LaunchStorageData = {
  // Flow control
  currentStep: 0,
  completedSteps: [],
  isResumed: false,

  // Token basics
  tokenName: "",
  tokenSymbol: "",
  tokenDescription: "",
  initialSupply: "100000000",

  // Token options
  maxSupply: "",
  isBurnable: false,
  isMintable: true,
  isPausable: false,
  isUpgradeable: false,

  // Token creation results
  tokenType: null,
  treasuryCapId: null,

  // Pool creation results
  poolId: null,
  poolAddress: null,
  poolName: null,

  // Pool form data
  poolPrefilled: false,
  poolCoinTypes: null,
  poolValues: null,
  poolQuoterId: null,
  poolFeeTier: null,
  poolFormValues: null,
  poolSelectedCoinTypes: null
};

/**
 * Custom hook for managing launch flow session storage
 * This provides a centralized way to interact with all storage operations
 */
export default function useLaunchStorage() {
  const [data, setData] = useState<LaunchStorageData>(DEFAULT_LAUNCH_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load all data from session storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Helper to safely get values from session storage with proper type conversion
      const getStorageValue = <T>(key: string, defaultValue: T): T => {
        const value = sessionStorage.getItem(key);
        if (value === null) return defaultValue;

        try {
          // Try parsing as JSON first (for objects, arrays, booleans)
          return JSON.parse(value) as T;
        } catch (e) {
          // If parsing fails, return as string or default
          return (value as unknown) as T;
        }
      };

      // Load all values from session storage
      const loadedData: LaunchStorageData = {
        // Flow control
        currentStep: parseInt(getStorageValue(STORAGE_KEYS.CURRENT_STEP, "0")),
        completedSteps: getStorageValue(STORAGE_KEYS.COMPLETED_STEPS, []),
        isResumed: getStorageValue(STORAGE_KEYS.IS_RESUMED, false),

        // Token basics
        tokenName: getStorageValue(STORAGE_KEYS.TOKEN_NAME, ""),
        tokenSymbol: getStorageValue(STORAGE_KEYS.TOKEN_SYMBOL, ""),
        tokenDescription: getStorageValue(STORAGE_KEYS.TOKEN_DESCRIPTION, ""),
        initialSupply: getStorageValue(STORAGE_KEYS.INITIAL_SUPPLY, DEFAULT_LAUNCH_DATA.initialSupply),

        // Token options
        maxSupply: getStorageValue(STORAGE_KEYS.MAX_SUPPLY, ""),
        isBurnable: getStorageValue(STORAGE_KEYS.IS_BURNABLE, false) === true || getStorageValue(STORAGE_KEYS.IS_BURNABLE, "") === "true",
        isMintable: getStorageValue(STORAGE_KEYS.IS_MINTABLE, true) === true || getStorageValue(STORAGE_KEYS.IS_MINTABLE, "") === "true",
        isPausable: getStorageValue(STORAGE_KEYS.IS_PAUSABLE, false) === true || getStorageValue(STORAGE_KEYS.IS_PAUSABLE, "") === "true",
        isUpgradeable: getStorageValue(STORAGE_KEYS.IS_UPGRADEABLE, false) === true || getStorageValue(STORAGE_KEYS.IS_UPGRADEABLE, "") === "true",

        // Token creation results
        tokenType: getStorageValue(STORAGE_KEYS.TOKEN_TYPE, null),
        treasuryCapId: getStorageValue(STORAGE_KEYS.TREASURY_CAP_ID, null),

        // Pool creation results
        poolId: getStorageValue(STORAGE_KEYS.POOL_ID, null),
        poolAddress: getStorageValue(STORAGE_KEYS.POOL_ADDRESS, null),
        poolName: getStorageValue(STORAGE_KEYS.POOL_NAME, null),

        // Pool form data
        poolPrefilled: getStorageValue(STORAGE_KEYS.POOL_PREFILLED, false) === true,
        poolCoinTypes: getStorageValue(STORAGE_KEYS.POOL_COIN_TYPES, null),
        poolValues: getStorageValue(STORAGE_KEYS.POOL_VALUES, null),
        poolQuoterId: getStorageValue(STORAGE_KEYS.POOL_QUOTER_ID, null),
        poolFeeTier: getStorageValue(STORAGE_KEYS.POOL_FEE_TIER, null),
        poolFormValues: getStorageValue(STORAGE_KEYS.POOL_FORM_VALUES, null),
        poolSelectedCoinTypes: getStorageValue(STORAGE_KEYS.POOL_SELECTED_COIN_TYPES, null)
      };

      // Determine if this is a resumed session
      const isResumedSession = loadedData.currentStep > 0 || loadedData.tokenName !== "";
      loadedData.isResumed = isResumedSession;

      // Update the state with loaded data
      setData(loadedData);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error loading launch data from session storage:", error);
      // In case of error, use default values
      setData(DEFAULT_LAUNCH_DATA);
      setIsLoaded(true);
    }
  }, []);

  // Save a single value to session storage and update state
  const updateValue = <K extends keyof LaunchStorageData>(key: K, value: LaunchStorageData[K]) => {
    if (typeof window === "undefined") return;

    try {
      // Update the state
      setData((prevData) => ({
        ...prevData,
        [key]: value
      }));

      // Store in session storage
      const storageKey = Object.entries(STORAGE_KEYS).find(([_, val]) => val === key)?.[1] ||
                         Object.entries(STORAGE_KEYS).find(([k, _]) => k === key.toString().toUpperCase())?.[1] ||
                         key;

      if (value === null) {
        sessionStorage.removeItem(storageKey);
      } else if (typeof value === "object") {
        sessionStorage.setItem(storageKey, JSON.stringify(value));
      } else {
        sessionStorage.setItem(storageKey, String(value));
      }
    } catch (error) {
      console.error(`Error saving launch data "${key}" to session storage:`, error);
    }
  };

  // Update multiple values at once
  const updateValues = (updates: Partial<LaunchStorageData>) => {
    if (typeof window === "undefined") return;

    try {
      // Update state with all changes
      setData((prevData) => ({
        ...prevData,
        ...updates
      }));

      // Update session storage for each key
      Object.entries(updates).forEach(([key, value]) => {
        const typedKey = key as keyof LaunchStorageData;
        const storageKey = Object.entries(STORAGE_KEYS).find(([k, _]) => k === key.toString().toUpperCase())?.[1] ||
                           key;

        if (value === null) {
          sessionStorage.removeItem(storageKey);
        } else if (typeof value === "object") {
          sessionStorage.setItem(storageKey, JSON.stringify(value));
        } else {
          sessionStorage.setItem(storageKey, String(value));
        }
      });
    } catch (error) {
      console.error("Error saving multiple launch data values to session storage:", error);
    }
  };

  // Clear all launch data from session storage
  const clearAllData = () => {
    if (typeof window === "undefined") return;

    try {
      // Reset state to defaults
      setData(DEFAULT_LAUNCH_DATA);

      // Clear all keys from session storage
      Object.values(STORAGE_KEYS).forEach((key) => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error("Error clearing launch data from session storage:", error);
    }
  };

  // Clear only pool-related data
  const clearPoolData = () => {
    if (typeof window === "undefined") return;

    try {
      // Update state by removing pool data
      setData((prevData) => ({
        ...prevData,
        poolId: null,
        poolAddress: null,
        poolName: null,
        poolPrefilled: false,
        poolCoinTypes: null,
        poolValues: null,
        poolQuoterId: null,
        poolFeeTier: null,
        poolFormValues: null,
        poolSelectedCoinTypes: null
      }));

      // Clear pool-related keys from session storage
      sessionStorage.removeItem(STORAGE_KEYS.POOL_ID);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_ADDRESS);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_NAME);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_PREFILLED);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_COIN_TYPES);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_VALUES);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_QUOTER_ID);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_FEE_TIER);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_FORM_VALUES);
      sessionStorage.removeItem(STORAGE_KEYS.POOL_SELECTED_COIN_TYPES);
    } catch (error) {
      console.error("Error clearing pool data from session storage:", error);
    }
  };

  // Check if we're in a new session from URL parameter
  const checkForNewSession = () => {
    if (typeof window === "undefined") return false;

    const isNewSession = window.location.search.includes("new=true");

    if (isNewSession) {
      // Remove the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Clear data for new session
      clearAllData();
      return true;
    }

    return false;
  };

  // Mark a step as completed
  const markStepComplete = (step: number) => {
    if (!data.completedSteps.includes(step)) {
      const newCompletedSteps = [...data.completedSteps, step];
      updateValue("completedSteps", newCompletedSteps);
    }
  };

  // Set the current step
  const setCurrentStep = (step: number) => {
    updateValue("currentStep", step);
  };

  // Get pool data for easier access in PoolCreationForm
  const getPoolDataFromStorage = () => {
    return {
      poolId: data.poolId,
      poolAddress: data.poolAddress,
      poolName: data.poolName,
      poolPrefilled: data.poolPrefilled,
      poolCoinTypes: data.poolCoinTypes,
      poolValues: data.poolValues,
      poolQuoterId: data.poolQuoterId,
      poolFeeTier: data.poolFeeTier,
      poolFormValues: data.poolFormValues,
      poolSelectedCoinTypes: data.poolSelectedCoinTypes
    };
  };

  return {
    data,
    isLoaded,
    updateValue,
    updateValues,
    clearAllData,
    clearPoolData,
    checkForNewSession,
    markStepComplete,
    setCurrentStep,
    getPoolDataFromStorage
  };
}
