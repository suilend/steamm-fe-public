import { ClassValue } from "clsx";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LaunchStepperProps {
  className?: ClassValue;
  currentStep: number;
  completedSteps: number[];
  onStepChange: (step: number) => void;
  isLoading?: boolean;
}

export default function LaunchStepper({
  className,
  currentStep,
  completedSteps,
  onStepChange,
  isLoading = false,
}: LaunchStepperProps) {
  const steps = [
    { title: "Token Basics", description: "Configure basic token info" },
    { title: "Token Options", description: "Configure token features" },
    { title: "Create Token", description: "Deploy to blockchain" },
    { title: "Create Pool", description: "Set up liquidity pool" },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn("flex w-full flex-col gap-4", className)}>
        {/* Mobile view skeleton */}
        <div className="flex w-full md:hidden">
          <div className="flex w-full items-center gap-1 sm:gap-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={`skeleton-mobile-step-${index}`}
                className="flex flex-1 flex-col"
              >
                <div className="relative">
                  <Skeleton className="h-1 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile view: Title and description skeleton */}
        <div className="mt-5 block pb-2 md:hidden">
          <Skeleton className="mx-auto mb-1 h-5 w-32" />
          <Skeleton className="mx-auto h-4 w-48" />
        </div>

        {/* Desktop view skeleton */}
        <div className="hidden w-full flex-row items-center gap-4 md:flex">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={`skeleton-desktop-step-${index}`}
              className="flex flex-1 flex-col gap-2"
            >
              <Skeleton className="h-1 w-full rounded-full" />
              <div className="flex flex-col">
                <Skeleton className="mb-1 h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* Mobile view: Only show progress bars with numbers */}
      <div className="flex w-full md:hidden">
        <div className="flex w-full items-center gap-1 sm:gap-2">
          {steps.map((_, index) => (
            <div
              key={`mobile-step-${index}`}
              className={cn(
                "flex flex-1 cursor-pointer flex-col",
                index > currentStep &&
                  !completedSteps.includes(index) &&
                  "cursor-not-allowed opacity-60",
              )}
              onClick={() => {
                // Only allow navigation to completed steps or current+1
                if (
                  completedSteps.includes(index) ||
                  index <= currentStep ||
                  index === currentStep + 1
                ) {
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
      <div className="mt-5 block pb-2 md:hidden">
        <p className="text-sm sm:text-base text-center font-medium text-foreground">
          {steps[currentStep].title}
        </p>
        <p className="text-xs sm:text-sm text-center text-secondary-foreground">
          {steps[currentStep].description}
        </p>
      </div>

      {/* Desktop view: Original stepper with full text */}
      <div className="hidden w-full cursor-pointer flex-row items-center gap-4 md:flex">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={cn(
              "flex flex-1 flex-col gap-2",
              index > currentStep &&
                !completedSteps.includes(index) &&
                "cursor-not-allowed opacity-60",
            )}
            onClick={() => {
              // Only allow navigation to completed steps or current+1
              if (
                completedSteps.includes(index) ||
                index <= currentStep ||
                index === currentStep + 1
              ) {
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
                    : "cursor-pointer bg-border hover:bg-border/80",
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
