import { useState } from "react";

import Container from "@/components/Container";
import LaunchStepper from "@/components/launch/LaunchStepper";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenAdvancedOptions from "@/components/launch/TokenAdvancedOptions/index";
import { useLoadedAppContext } from "@/contexts/AppContext";
import TokenCreationForm from "@/components/launch/TokenCreationForm";
import { CreateTokenParams } from "@/hooks/useCreateToken";

export default function LaunchPage() {
  const { appData } = useLoadedAppContext();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Basic Info State
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [initialSupply, setInitialSupply] = useState("");

  // Advanced Options State
  const [maxSupply, setMaxSupply] = useState("");
  const [isBurnable, setIsBurnable] = useState(false);
  const [isMintable, setIsMintable] = useState(true); // Default to true as it's common
  const [isPausable, setIsPausable] = useState(false);
  const [isUpgradeable, setIsUpgradeable] = useState(false);

  // Token creation result
  const [tokenType, setTokenType] = useState<string | null>(null);
  const [treasuryCapId, setTreasuryCapId] = useState<string | null>(null);

  const handleBasicInfoSubmit = () => {
    // Form validation is now handled within the TokenBasicInfo component
    setCurrentStep(1);
  };

  const handleAdvancedOptionsSubmit = () => {
    // Form validation is now handled within the TokenAdvancedOptions component
    setCurrentStep(2); // Move to token creation step
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepChange = (step: number) => {
    // Only allow going back or to the next step if current step is complete
    if (step < currentStep || step === currentStep + 1) {
      setCurrentStep(step);
    }
  };

  const handleTokenCreationSuccess = (tokenType: string, treasuryCapId: string) => {
    setTokenType(tokenType);
    setTreasuryCapId(treasuryCapId);
    // In a real implementation, you would move to the next step after this
  };

  // Prepare token parameters for creation
  const tokenParams: CreateTokenParams = {
    name: tokenName,
    symbol: tokenSymbol,
    description: tokenDescription,
    initialSupply: initialSupply,
    decimals: 9, // Default decimals for most tokens
    isMintable,
    isBurnable,
    isPausable,
    isUpgradeable,
  };

  return (
    <Container className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-2">
        <h1 className="text-h1 text-foreground">Launch</h1>
        <p className="text-p1 text-secondary-foreground">
          Create a new token and launch a liquidity pool
        </p>
      </div>

      <LaunchStepper
        currentStep={currentStep}
        onStepChange={handleStepChange}
      />

      <div className="flex w-full flex-col gap-4">
        {currentStep === 0 ? (
          <TokenBasicInfo
            name={tokenName}
            onNameChange={setTokenName}
            symbol={tokenSymbol}
            onSymbolChange={setTokenSymbol}
            description={tokenDescription}
            onDescriptionChange={setTokenDescription}
            initialSupply={initialSupply}
            onInitialSupplyChange={setInitialSupply}
            onSubmit={handleBasicInfoSubmit}
          />
        ) : currentStep === 1 ? (
          <TokenAdvancedOptions
            maxSupply={maxSupply}
            onMaxSupplyChange={setMaxSupply}
            isBurnable={isBurnable}
            onBurnableChange={setIsBurnable}
            isMintable={isMintable}
            onMintableChange={setIsMintable}
            isPausable={isPausable}
            onPausableChange={setIsPausable}
            isUpgradeable={isUpgradeable}
            onUpgradeableChange={setIsUpgradeable}
            onBack={handleBack}
            onSubmit={handleAdvancedOptionsSubmit}
            initialSupply={initialSupply}
          />
        ) : (
          <TokenCreationForm
            tokenParams={tokenParams}
            onSuccess={handleTokenCreationSuccess}
          >
            <div className="rounded-md border border-border bg-card p-6">
              <h2 className="mb-4 text-xl font-semibold">Token Creation</h2>
              
              <div className="mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are about to create a new token with the following details:
                </p>
                
                <ul className="space-y-1 text-sm">
                  <li><strong>Name:</strong> {tokenName}</li>
                  <li><strong>Symbol:</strong> {tokenSymbol}</li>
                  <li><strong>Initial Supply:</strong> {initialSupply}</li>
                  <li><strong>Features:</strong> {[
                    isMintable && "Mintable",
                    isBurnable && "Burnable",
                    isPausable && "Pausable",
                    isUpgradeable && "Upgradeable"
                  ].filter(Boolean).join(", ") || "None"}</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Click the button below to review and confirm the token creation transaction.
              </p>
            </div>
          </TokenCreationForm>
        )}
      </div>
    </Container>
  );
} 