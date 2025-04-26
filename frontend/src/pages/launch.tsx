import { useEffect, useState } from "react";

import { CheckCircle2 } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";

import { useWalletContext } from "@suilend/frontend-sui-next";

import Container from "@/components/Container";
import LaunchStepper from "@/components/launch/LaunchStepper";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenCreationForm from "@/components/launch/TokenCreationForm";
import { Button } from "@/components/ui/button";
import { LaunchConfig, LaunchStep } from "@/hooks/useCreateToken";
import { Alert, AlertDescription, AlertTitle } from "@/lib/alert";

const DEFAULT_CONFIG: LaunchConfig = {
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
  iconUrl: "https://steamm-assets.s3.amazonaws.com/token-icon.png",

  // Token creation results
  tokenType: null,
  treasuryCapId: null,

  // Pool creation results
  poolId: null,
};

export default function LaunchPage() {
  const { address } = useWalletContext();
  const [config, setConfig] = useLocalStorage<LaunchConfig>(
    "launch-config",
    DEFAULT_CONFIG,
  );
  const [isResumed, setIsResumed] = useState(false);

  useEffect(() => {
    setIsResumed(JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentStep = (step: LaunchStep) => {
    setConfig({ ...config, step });
  };

  // Handle step changes from the stepper
  const handleStepChange = (step: number) => {
    // Only allow going back, to the current step, to the next step, or to a completed step
    if (
      step <= config.step ||
      step === config.step + 1 ||
      config.lastCompletedStep === step
    ) {
      setCurrentStep(step);
    }
  };

  // Function to start over
  const handleStartOver = () => {
    setConfig(DEFAULT_CONFIG);
    setIsResumed(false);
  };

  // Handle successful token creation
  const handleTokenCreationSuccess = (
    tokenType: string,
    treasuryCapId: string,
    poolId: string,
  ) => {
    // Update token creation result data
    setConfig({
      ...config,
      tokenType,
      treasuryCapId,
      poolId,
    });

    setCurrentStep(LaunchStep.Complete);
  };

  return (
    <Container className="flex w-full flex-col gap-6 py-4 sm:py-6">
      {isResumed && (
        <div className="border-info bg-info/10 mb-2 flex w-full items-center justify-between rounded-md border p-3">
          <p className="text-sm text-info">Resuming your previous session</p>
          <Button variant="outline" size="sm" onClick={handleStartOver}>
            Start Over
          </Button>
        </div>
      )}

      {!address && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Please connect your wallet</AlertTitle>
          <AlertDescription>
            You need to connect a wallet to create a token and liquidity pool.
          </AlertDescription>
        </Alert>
      )}

      <div className="w-full">
        <LaunchStepper
          currentStep={config.step}
          completedSteps={config.lastCompletedStep}
          onStepChange={handleStepChange}
        />
      </div>

      <div className="mt-4 w-full md:mx-auto md:max-w-2xl">
        {config.step === LaunchStep.Config && (
          <TokenBasicInfo
            config={config}
            setConfig={setConfig}
            onSubmit={() => handleStepChange(LaunchStep.Deploy)}
          />
        )}

        {config.step === LaunchStep.Deploy && (
          <TokenCreationForm
            tokenParams={config}
            onSuccess={handleTokenCreationSuccess}
          />
        )}

        {config.step === LaunchStep.Complete && (
          <div className="mx-auto flex max-w-md flex-col items-center space-y-6 rounded-lg border p-6 text-center">
            <div className="rounded-full flex h-16 w-16 items-center justify-center bg-success/20">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>

            <div>
              <h2 className="text-xl mb-2 font-semibold">Congratulations!</h2>
              <p className="text-secondary-foreground">
                You&apos;ve successfully created a token and liquidity pool.
              </p>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => {
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
