import { ClassValue } from "clsx";

import { cn } from "@/lib/utils";

interface LaunchStepperProps {
  className?: ClassValue;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export default function LaunchStepper({
  className,
  currentStep,
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
      <div className="flex w-full flex-row items-center gap-4">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="flex flex-1 flex-col gap-2"
            onClick={() => onStepChange(index)}
          >
            <div
              className={cn(
                "flex h-1 w-full rounded-full transition-colors",
                index <= currentStep
                  ? "bg-foreground"
                  : "bg-border cursor-pointer hover:bg-border/80",
              )}
            />
            <div className="flex flex-col">
              <p className="text-p2 text-foreground">{step.title}</p>
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