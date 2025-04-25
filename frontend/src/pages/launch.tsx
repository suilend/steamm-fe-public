import { useEffect, useState } from "react";

import { CheckCircle2 } from "lucide-react";

import { useWalletContext } from "@suilend/frontend-sui-next";

import Container from "@/components/Container";
import LaunchStepper from "@/components/launch/LaunchStepper";
import PoolCreationForm from "@/components/launch/PoolCreationForm";
import TokenAdvancedOptions from "@/components/launch/TokenAdvancedOptions/index";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenCreationForm from "@/components/launch/TokenCreationForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CreateTokenParams } from "@/hooks/useCreateToken";
import useLaunchStorage from "@/hooks/useLaunchStorage";

export default function LaunchPage() {
  const { address } = useWalletContext();

  // Use our new storage hook for all session persistence
  const {
    data: storage,
    isLoaded,
    updateValue,
    updateValues,
    clearAllData,
    clearPoolData,
    checkForNewSession,
    markStepComplete,
    setCurrentStep,
  } = useLaunchStorage();

  // Local UI loading states that don't need to be persisted
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTokenFormLoading, setIsTokenFormLoading] = useState(true);
  const [isPoolFormLoading, setIsPoolFormLoading] = useState(true);

  // Check for a new session on mount, and set up loading states
  useEffect(() => {
    // Check if we're starting a new session from URL
    checkForNewSession();

    // Simulate initial page loading with staggered timings
    const pageTimer = setTimeout(() => {
      setIsPageLoading(false);

      const tokenFormTimer = setTimeout(
        () => setIsTokenFormLoading(false),
        400,
      );
      const poolFormTimer = setTimeout(() => setIsPoolFormLoading(false), 600);

      return () => {
        clearTimeout(tokenFormTimer);
        clearTimeout(poolFormTimer);
      };
    }, 800);

    return () => clearTimeout(pageTimer);
  }, []);

  // Handle basic info submission
  const handleBasicInfoSubmit = () => {
    markStepComplete(0);
    setCurrentStep(1);
  };

  // Handle advanced options submission
  const handleAdvancedOptionsSubmit = () => {
    markStepComplete(1);
    setCurrentStep(2);
  };

  // Handle back button navigation
  const handleBack = () => {
    if (storage.currentStep > 0) {
      setCurrentStep(storage.currentStep - 1);
    }
  };

  // Handle step changes from the stepper
  const handleStepChange = (step: number) => {
    // Only allow going back, to the current step, to the next step, or to a completed step
    if (
      step <= storage.currentStep ||
      step === storage.currentStep + 1 ||
      storage.completedSteps.includes(step)
    ) {
      setCurrentStep(step);
    }
  };

  // Handle successful token creation
  const handleTokenCreationSuccess = (
    tokenType: string,
    treasuryCapId: string,
  ) => {
    // Clear any pool data to ensure we don't skip steps
    clearPoolData();

    // Update token creation result data
    updateValues({
      tokenType,
      treasuryCapId,
      poolId: null, // Explicitly clear poolId to avoid confusion
    });

    markStepComplete(2);
    setCurrentStep(3);
  };

  // Handle successful pool creation
  const handlePoolCreationSuccess = (poolId: string) => {
    updateValue("poolId", poolId);
    markStepComplete(3);
    // We stay on the same step but show completion message
  };

  // Function to start over
  const handleStartOver = () => {
    clearAllData();
    window.location.href = "/launch?new=true";
  };

  // Prepare token parameters for creation
  const tokenParams: CreateTokenParams = {
    name: storage.tokenName,
    symbol: storage.tokenSymbol,
    description: storage.tokenDescription,
    initialSupply: storage.initialSupply,
    decimals: 9, // Default decimals for most tokens
    isMintable: storage.isMintable,
    isBurnable: storage.isBurnable,
    isPausable: storage.isPausable,
    isUpgradeable: storage.isUpgradeable,
  };

  console.log(storage.completedSteps)
  // Show a success screen if all steps are completed
  const isCompleted =
    storage.completedSteps.includes(3) && storage.poolId !== null;

  // If storage isn't loaded yet, show nothing (this prevents flashing)
  if (!isLoaded) {
    return null;
  }

  return (
    <Container className="flex w-full flex-col gap-6 py-4 sm:py-6">
      {storage.isResumed && (
        <div className="border-info bg-info/10 mb-2 flex w-full items-center justify-between rounded-md border p-3">
          <p className="text-sm text-info">Resuming your previous session</p>
          <Button variant="outline" size="sm" onClick={handleStartOver}>
            Start Over
          </Button>
        </div>
      )}

      {!isPageLoading && !address && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Please connect your wallet</AlertTitle>
          <AlertDescription>
            You need to connect a wallet to create a token and liquidity pool.
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full">
        <LaunchStepper
          currentStep={storage.currentStep}
          completedSteps={storage.completedSteps}
          onStepChange={handleStepChange}
          isLoading={isPageLoading}
        />
      </div>

      <div className="mt-4 w-full md:mx-auto md:max-w-2xl">
        {storage.currentStep === 0 && (
          <TokenBasicInfo
            name={storage.tokenName}
            symbol={storage.tokenSymbol}
            description={storage.tokenDescription}
            initialSupply={storage.initialSupply}
            setName={(value) => updateValue("tokenName", value)}
            setSymbol={(value) => updateValue("tokenSymbol", value)}
            setDescription={(value) => updateValue("tokenDescription", value)}
            setInitialSupply={(value) => updateValue("initialSupply", value)}
            onSubmit={handleBasicInfoSubmit}
            isLoading={isPageLoading || isTokenFormLoading}
          />
        )}

        {storage.currentStep === 1 && (
          <TokenAdvancedOptions
            maxSupply={storage.maxSupply}
            isBurnable={storage.isBurnable}
            isMintable={storage.isMintable}
            isPausable={storage.isPausable}
            isUpgradeable={storage.isUpgradeable}
            setMaxSupply={(value) => updateValue("maxSupply", value)}
            setIsBurnable={(value) => updateValue("isBurnable", value)}
            setIsMintable={(value) => updateValue("isMintable", value)}
            setIsPausable={(value) => updateValue("isPausable", value)}
            setIsUpgradeable={(value) => updateValue("isUpgradeable", value)}
            onBack={handleBack}
            onSubmit={handleAdvancedOptionsSubmit}
            isLoading={isPageLoading || isTokenFormLoading}
          />
        )}

        {storage.currentStep === 2 && (
          <TokenCreationForm
            tokenParams={tokenParams}
            onSuccess={handleTokenCreationSuccess}
            isLoading={isPageLoading || isTokenFormLoading}
          >
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Token Review</h2>
              <p className="text-sm text-muted-foreground">
                Review your token details before creating it on the blockchain
              </p>

              <div className="space-y-3 rounded-md border p-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Name</span>
                  <span className="text-sm">{storage.tokenName}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Symbol</span>
                  <span className="text-sm">{storage.tokenSymbol}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Initial Supply</span>
                  <span className="text-sm">
                    {storage.initialSupply} {storage.tokenSymbol}
                  </span>
                </div>

                {storage.tokenDescription && (
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Description</span>
                    <span className="text-sm">{storage.tokenDescription}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <span className="text-sm font-medium">Options</span>
                  <div className="flex flex-wrap gap-2">
                    {storage.isMintable && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Mintable
                      </span>
                    )}
                    {storage.isBurnable && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Burnable
                      </span>
                    )}
                    {storage.isPausable && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Pausable
                      </span>
                    )}
                    {storage.isUpgradeable && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Upgradeable
                      </span>
                    )}
                    {storage.maxSupply && (
                      <span className="text-xs rounded-full bg-primary/10 px-2 py-1 text-primary">
                        Max Supply: {storage.maxSupply}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TokenCreationForm>
        )}

        {storage.currentStep === 3 && (
          <PoolCreationForm
            tokenType={storage.tokenType || undefined}
            onBack={handleBack}
            onSuccess={handlePoolCreationSuccess}
          />
        )}

        {isCompleted && (
          <div className="mx-auto flex max-w-md flex-col items-center space-y-6 rounded-lg border p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>

            <div>
              <h2 className="text-xl mb-2 font-semibold">Congratulations!</h2>
              <p className="text-secondary-foreground">
                You've successfully created a token and liquidity pool.
              </p>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => {
                // Clear session and redirect to dashboard or other page
                clearAllData();
                window.location.href = "/";
              }}
              className="px-6"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}
