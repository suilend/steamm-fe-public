import { useState, useEffect } from "react";

import Container from "@/components/Container";
import LaunchStepper from "@/components/launch/LaunchStepper";
import TokenBasicInfo from "@/components/launch/TokenBasicInfo";
import TokenAdvancedOptions from "@/components/launch/TokenAdvancedOptions/index";
import TokenCreationForm from "@/components/launch/TokenCreationForm";
import PoolCreationForm from "@/components/launch/PoolCreationForm";
import { CreateTokenParams } from "@/hooks/useCreateToken";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function LaunchPage() {
  const [currentStep, setCurrentStep] = useState(3);
  
  // Basic Info State
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenDescription, setTokenDescription] = useState("");
  const [initialSupply, setInitialSupply] = useState("100000000");

  // Advanced Options State
  const [maxSupply, setMaxSupply] = useState("");
  const [isBurnable, setIsBurnable] = useState(false);
  const [isMintable, setIsMintable] = useState(true); // Default to true as it's common
  const [isPausable, setIsPausable] = useState(false);
  const [isUpgradeable, setIsUpgradeable] = useState(false);

  // Token creation result
  const [tokenType, setTokenType] = useState<string | null>(null);
  const [treasuryCapId, setTreasuryCapId] = useState<string | null>(null);
  
  // Pool creation result
  const [poolId, setPoolId] = useState<string | null>(null);
  
  // Track completed steps
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  // Track if this is a resumed session
  const [isResumedSession, setIsResumedSession] = useState(false);
  
  // Load saved data from session storage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load step
      const savedStep = sessionStorage.getItem("launchCurrentStep");
      if (savedStep) {
        setCurrentStep(parseInt(savedStep, 10));
      }
      
      // Load completed steps
      const savedCompletedSteps = sessionStorage.getItem("launchCompletedSteps");
      if (savedCompletedSteps) {
        setCompletedSteps(JSON.parse(savedCompletedSteps));
      }
      
      // Load basic info
      const savedTokenName = sessionStorage.getItem("launchTokenName");
      if (savedTokenName) setTokenName(savedTokenName);
      
      const savedTokenSymbol = sessionStorage.getItem("launchTokenSymbol");
      if (savedTokenSymbol) setTokenSymbol(savedTokenSymbol);
      
      const savedTokenDesc = sessionStorage.getItem("launchTokenDescription");
      if (savedTokenDesc) setTokenDescription(savedTokenDesc);
      
      const savedInitialSupply = sessionStorage.getItem("launchInitialSupply");
      if (savedInitialSupply) setInitialSupply(savedInitialSupply);
      
      // Load advanced options
      const savedMaxSupply = sessionStorage.getItem("launchMaxSupply");
      if (savedMaxSupply) setMaxSupply(savedMaxSupply);
      
      const savedIsBurnable = sessionStorage.getItem("launchIsBurnable");
      if (savedIsBurnable) setIsBurnable(savedIsBurnable === "true");
      
      const savedIsMintable = sessionStorage.getItem("launchIsMintable");
      if (savedIsMintable) setIsMintable(savedIsMintable === "true");
      
      const savedIsPausable = sessionStorage.getItem("launchIsPausable");
      if (savedIsPausable) setIsPausable(savedIsPausable === "true");
      
      const savedIsUpgradeable = sessionStorage.getItem("launchIsUpgradeable");
      if (savedIsUpgradeable) setIsUpgradeable(savedIsUpgradeable === "true");
      
      // Load token creation result
      const savedTokenType = sessionStorage.getItem("launchTokenType");
      if (savedTokenType) setTokenType(savedTokenType);
      
      const savedTreasuryCapId = sessionStorage.getItem("launchTreasuryCapId");
      if (savedTreasuryCapId) setTreasuryCapId(savedTreasuryCapId);
      
      // Load pool creation result
      const savedPoolId = sessionStorage.getItem("launchPoolId");
      if (savedPoolId) setPoolId(savedPoolId);
      
      // Check if this is a resumed session
      if ((savedStep && parseInt(savedStep, 10) > 0) || savedTokenName) {
        setIsResumedSession(true);
      }
    }
  }, []);
  
  // Save current step to session storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("launchCurrentStep", currentStep.toString());
    }
  }, [currentStep]);
  
  // Save completed steps whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("launchCompletedSteps", JSON.stringify(completedSteps));
    }
  }, [completedSteps]);
  
  // Save basic info to session storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("launchTokenName", tokenName);
      sessionStorage.setItem("launchTokenSymbol", tokenSymbol);
      sessionStorage.setItem("launchTokenDescription", tokenDescription);
      sessionStorage.setItem("launchInitialSupply", initialSupply);
    }
  }, [tokenName, tokenSymbol, tokenDescription, initialSupply]);
  
  // Save advanced options to session storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem("launchMaxSupply", maxSupply);
      sessionStorage.setItem("launchIsBurnable", isBurnable.toString());
      sessionStorage.setItem("launchIsMintable", isMintable.toString());
      sessionStorage.setItem("launchIsPausable", isPausable.toString());
      sessionStorage.setItem("launchIsUpgradeable", isUpgradeable.toString());
    }
  }, [maxSupply, isBurnable, isMintable, isPausable, isUpgradeable]);
  
  // Save token creation result whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && tokenType) {
      sessionStorage.setItem("launchTokenType", tokenType);
    }
    
    if (typeof window !== 'undefined' && treasuryCapId) {
      sessionStorage.setItem("launchTreasuryCapId", treasuryCapId);
    }
  }, [tokenType, treasuryCapId]);
  
  // Save pool creation result whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && poolId) {
      sessionStorage.setItem("launchPoolId", poolId);
    }
  }, [poolId]);

  // Mark a step as completed
  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };
  
  const handleBasicInfoSubmit = () => {
    // Form validation is now handled within the TokenBasicInfo component
    markStepComplete(0);
    setCurrentStep(1);
  };

  const handleAdvancedOptionsSubmit = () => {
    // Form validation is now handled within the TokenAdvancedOptions component
    markStepComplete(1);
    setCurrentStep(2); // Move to token creation step
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepChange = (step: number) => {
    // Only allow going back, to the current step, to the next step, or to a completed step
    if (step <= currentStep || step === currentStep + 1 || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const handleTokenCreationSuccess = (tokenType: string, treasuryCapId: string) => {
    setTokenType(tokenType);
    setTreasuryCapId(treasuryCapId);
    markStepComplete(2);
    // Move to pool creation step
    setCurrentStep(3);
  };
  
  const handlePoolCreationSuccess = (poolId: string) => {
    setPoolId(poolId);
    markStepComplete(3);
    // Stay on the same step but show completion message
  };
  
  // Function to clear session storage data
  const clearSessionData = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("launchCurrentStep");
      sessionStorage.removeItem("launchCompletedSteps");
      sessionStorage.removeItem("launchTokenName");
      sessionStorage.removeItem("launchTokenSymbol");
      sessionStorage.removeItem("launchTokenDescription");
      sessionStorage.removeItem("launchInitialSupply");
      sessionStorage.removeItem("launchMaxSupply");
      sessionStorage.removeItem("launchIsBurnable");
      sessionStorage.removeItem("launchIsMintable");
      sessionStorage.removeItem("launchIsPausable");
      sessionStorage.removeItem("launchIsUpgradeable");
      sessionStorage.removeItem("launchTokenType");
      sessionStorage.removeItem("launchTreasuryCapId");
      sessionStorage.removeItem("launchPoolId");
    }
  };
  
  // Function to start over
  const handleStartOver = () => {
    clearSessionData();
    window.location.reload();
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
  
  // Show a success screen if all steps are completed
  const isCompleted = completedSteps.includes(3) && poolId;

  return (
    <Container className="flex w-full flex-col gap-6 py-4 sm:py-6">
      {isResumedSession && (
        <div className="flex w-full items-center justify-between rounded-md border border-info bg-info/10 p-3 mb-2">
          <p className="text-sm text-info">Resuming your previous session</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleStartOver}
          >
            Start Fresh
          </Button>
        </div>
      )}
    
      <div className="flex w-full flex-col gap-2">
        <h1 className="text-h1 text-foreground">Launch</h1>
        <p className="text-p1 text-secondary-foreground">
          Create a new token and launch a liquidity pool
        </p>
      </div>

      {!isCompleted && (
        <LaunchStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepChange={handleStepChange}
        />
      )}

      <div className="flex w-full flex-col gap-4">
        {isCompleted ? (
          <div className="flex w-full flex-col items-center gap-6 py-8">
            <div className="rounded-full bg-success/10 p-6">
              <CheckCircle2 className="h-20 w-20 text-success" />
            </div>
            
            <Alert className="max-w-xl">
              <AlertTitle className="text-xl">Launch Complete!</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="text-secondary-foreground mb-4">
                  You've successfully created a new token and launched a liquidity pool.
                </p>
                
                <div className="flex flex-col gap-2 mb-6">
                  <p className="text-sm font-medium">Token Type:</p>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono break-all">
                    {tokenType}
                  </code>
                  
                  <p className="text-sm font-medium mt-2">Pool ID:</p>
                  <code className="px-2 py-1 bg-muted rounded text-sm font-mono break-all">
                    {poolId}
                  </code>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button onClick={handleStartOver}>Start New Launch</Button>
                  {/* Add any other navigation buttons as needed */}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        ) : currentStep === 0 ? (
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
        ) : currentStep === 2 ? (
          <TokenCreationForm
            tokenParams={tokenParams}
            onSuccess={handleTokenCreationSuccess}
            onNext={() => {
              if (tokenType) {
                markStepComplete(2);
                setCurrentStep(3);
              }
            }}
          >
            <div className="rounded-md border border-border bg-card p-4 sm:p-6">
              <h2 className="mb-4 text-lg sm:text-xl font-semibold">Token Creation</h2>
              
              <div className="mb-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are about to create a new token with the following details:
                </p>
                
                <ul className="space-y-1 text-sm">
                  <li className="flex flex-wrap gap-1"><strong>Name:</strong> <span>{tokenName}</span></li>
                  <li className="flex flex-wrap gap-1"><strong>Symbol:</strong> <span>{tokenSymbol}</span></li>
                  <li className="flex flex-wrap gap-1"><strong>Initial Supply:</strong> <span>{initialSupply}</span></li>
                  <li className="flex flex-wrap gap-1">
                    <strong>Features:</strong> 
                    <span>{[
                      isMintable && "Mintable",
                      isBurnable && "Burnable",
                      isPausable && "Pausable",
                      isUpgradeable && "Upgradeable"
                    ].filter(Boolean).join(", ") || "None"}</span>
                  </li>
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Click the button below to review and confirm the token creation transaction.
              </p>
            </div>
          </TokenCreationForm>
        ) : (
          <PoolCreationForm
            tokenType={tokenType || undefined}
            onBack={handleBack}
            onSuccess={handlePoolCreationSuccess}
          />
        )}
      </div>
    </Container>
  );
} 