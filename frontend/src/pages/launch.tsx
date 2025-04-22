import { useState } from "react";

import Container from "@/components/Container";
import LaunchStepper from "@/components/launch/LaunchStepper";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenAdvancedOptions from "@/components/launch/TokenAdvancedOptions/index";
import { useLoadedAppContext } from "@/contexts/AppContext";

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

  const handleBasicInfoSubmit = () => {
    // Form validation is now handled within the TokenBasicInfo component
    setCurrentStep(1);
  };

  const handleAdvancedOptionsSubmit = () => {
    // Form validation is now handled within the TokenAdvancedOptions component
    
    // Build final token data
    const tokenData = {
      name: tokenName,
      symbol: tokenSymbol,
      description: tokenDescription,
      initialSupply,
      maxSupply: isMintable ? maxSupply : initialSupply, // If not mintable, max = initial
      isBurnable,
      isMintable,
      isPausable,
      isUpgradeable,
    };
    
    console.log("Final token data:", tokenData);
    
    // Here you would typically:
    // 1. Show a confirmation dialog
    // 2. Build and submit the transaction
    // 3. Handle transaction status and feedback
  };

  const handleBack = () => {
    setCurrentStep(0);
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
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
        ) : (
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
        )}
      </div>
    </Container>
  );
} 