import { useEffect, useState } from "react";

import { useWalletContext } from "@suilend/frontend-sui-next";

import Container from "@/components/Container";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenCreationForm from "@/components/launch/TokenCreationForm";
import { Button } from "@/components/ui/button";
import LaunchContextProvider, {
  DEFAULT_CONFIG,
  LaunchStep,
  useLaunch,
} from "@/contexts/LaunchContext";
import { Alert, AlertDescription, AlertTitle } from "@/lib/alert";

function LaunchPage() {
  const { config, setConfig } = useLaunch();
  const { address } = useWalletContext();
  const [isResumed, setIsResumed] = useState(false);

  useEffect(() => {
    setIsResumed(JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrentStep = (step: LaunchStep) => {
    setConfig({
      ...config,
      step,
      lastCompletedStep: Math.max(step - 1, config.lastCompletedStep),
    });
  };

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

  return (
    <Container className="flex w-full flex-col gap-6 py-4 sm:py-6">
      {isResumed && config.lastCompletedStep !== LaunchStep.Complete && (
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

      <div className="mt-4 w-full md:mx-auto md:max-w-2xl">
        {config.step === LaunchStep.Config && (
          <TokenBasicInfo
            config={config}
            setConfig={setConfig}
            onSubmit={() => handleStepChange(LaunchStep.Deploy)}
          />
        )}

        {[LaunchStep.Deploy, LaunchStep.Complete].includes(config.step) && (
          <TokenCreationForm onStepChange={handleStepChange} />
        )}
      </div>
    </Container>
  );
}

export default function LaunchPageWrapper() {
  return (
    <LaunchContextProvider>
      <LaunchPage />
    </LaunchContextProvider>
  );
}
