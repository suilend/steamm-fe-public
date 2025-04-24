import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface LaunchStepperProps {
  className?: ClassValue;
  currentStep: number;
  completedSteps: number[];
  onStepChange: (step: number) => void;
}

export default function LaunchStepper({
  className,
  currentStep,
  completedSteps,
  onStepChange,
}: LaunchStepperProps) {
  const steps = [
    { title: "Token Basics", description: "Configure basic token info" },
    { title: "Token Options", description: "Configure token features" },
    { title: "Create Token", description: "Deploy to blockchain" },
    { title: "Create Pool", description: "Set up liquidity pool" },
  ];

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* Mobile view: Only show progress bars with numbers */}
      <div className="flex w-full md:hidden">
        <div className="flex w-full items-center gap-1 sm:gap-2">
          {steps.map((_, index) => (
            <div 
              key={`mobile-step-${index}`}
              className={cn(
                "flex flex-1 flex-col cursor-pointer",
                (index > currentStep && !completedSteps.includes(index)) && "cursor-not-allowed opacity-60"
              )}
              onClick={() => {
                // Only allow navigation to completed steps or current+1
                if (completedSteps.includes(index) || index <= currentStep || index === currentStep + 1) {
                  onStepChange(index);
                }
              }}
            >
              <div className="relative">
                <div
                  className={cn(
                    "h-1 w-full rounded-full transition-colors",
                    completedSteps.includes(index)
                      ? "bg-success"
                      : index <= currentStep
                        ? "bg-foreground"
                        : "bg-border hover:bg-border/80",
                  )}
                />
                {/* Small indicator showing current step or checkmark for completed */}
                {index === currentStep ? (
                  <div className="absolute -bottom-4 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-foreground text-[10px] text-background">
                    {index + 1}
                  </div>
                ) : completedSteps.includes(index) ? (
                  <div className="absolute -bottom-4 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-success text-[10px] text-background">
                    ✓
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mobile view: Show only current step title and description */}
      <div className="block mt-5 pb-2 md:hidden">
        <p className="text-center text-sm sm:text-base font-medium text-foreground">
          {steps[currentStep].title}
        </p>
        <p className="text-center text-xs sm:text-sm text-secondary-foreground">
          {steps[currentStep].description}
        </p>
      </div>

      {/* Desktop view: Original stepper with full text */}
      <div className="hidden md:flex w-full flex-row items-center gap-4 cursor-pointer">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={cn(
              "flex flex-1 flex-col gap-2",
              (index > currentStep && !completedSteps.includes(index)) && "cursor-not-allowed opacity-60"
            )}
            onClick={() => {
              // Only allow navigation to completed steps or current+1
              if (completedSteps.includes(index) || index <= currentStep || index === currentStep + 1) {
                onStepChange(index);
              }
            }}
          >
            <div
              className={cn(
                "flex h-1 w-full rounded-full transition-colors",
                completedSteps.includes(index)
                  ? "bg-success"
                  : index <= currentStep
                    ? "bg-foreground"
                    : "bg-border cursor-pointer hover:bg-border/80",
              )}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <p className="text-p2 text-foreground">{step.title}</p>
                {completedSteps.includes(index) && (
                  <span className="text-xs font-medium text-success">✓</span>
                )}
              </div>
              <p className="text-p3 text-secondary-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 