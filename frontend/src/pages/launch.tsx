import { useEffect, useState } from "react";

import { useWalletContext } from "@suilend/frontend-sui-next";

import Container from "@/components/Container";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenCreationProgress from "@/components/launch/TokenCreationProgress";
import { Button } from "@/components/ui/button";
import LaunchContextProvider, {
  DEFAULT_CONFIG,
  TokenCreationStatus,
  useLaunch,
} from "@/contexts/LaunchContext";
import { cn } from "@/lib/utils";

export type FormErrors = {
  name: string;
  symbol: string;
  description: string;
  initialSupply: string;
  decimals: string;
  icon: string;
};
function LaunchPage() {
  // Validation state
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    symbol: "",
    description: "",
    initialSupply: "",
    decimals: "",
    icon: "",
  });
  const { config, setConfig, launchToken } = useLaunch();
  const { address } = useWalletContext();
  const [isResumed, setIsResumed] = useState(false);
  const { error } = config;

  useEffect(() => {
    setIsResumed(JSON.stringify(config) !== JSON.stringify(DEFAULT_CONFIG));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to start over
  const handleStartOver = () => {
    setConfig(DEFAULT_CONFIG);
    setIsResumed(false);
  };

  const handleCta = () => {
    if (config.status === TokenCreationStatus.Success) {
      // GOTO POOL
      return;
    }
    document.getElementById("progress-container")?.scrollIntoView();
    if (error) {
      setConfig({ ...config, error: null });
    }
    launchToken();
  };

  let ctaText = "Deploy";
  if (!address) {
    ctaText = "Connect Wallet";
  } else if (error) {
    ctaText = "Retry";
  } else if (config.status === TokenCreationStatus.Success) {
    ctaText = "Go to Pool";
  }

  return (
    <Container className="flex w-full flex-col gap-6 p-0">
      <div className="w-full md:mx-auto md:max-w-4xl">
        {isResumed && config.status !== TokenCreationStatus.Success && (
          <div className="border-info bg-info/10 mb-2 flex w-full items-center justify-between rounded-md border p-3">
            <p className="text-sm text-info">Resuming your previous session</p>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              Start Over
            </Button>
          </div>
        )}

        <TokenBasicInfo
          config={config}
          setConfig={setConfig}
          setErrors={setErrors}
          errors={errors}
        />
        {config.status !== TokenCreationStatus.Pending && (
          <div id="progress-container">
            <TokenCreationProgress />
          </div>
        )}

        {
          <button
            type="submit"
            disabled={
              Object.values(errors).some((error) => error !== "") || !address
            }
            className={cn(
              "mt-4 flex h-12 w-full items-center justify-center rounded-md bg-button-1 px-4 py-3 text-p2 text-button-1-foreground hover:bg-button-1/80 disabled:cursor-not-allowed disabled:opacity-50",
            )}
            onClick={handleCta}
          >
            {ctaText}
          </button>
        }
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
