import { ClassValue } from "clsx";
import { cn } from "@/lib/utils";
import { TokenCreationStatus, useLaunch, LaunchStep } from "@/contexts/LaunchContext";

interface LaunchStepperProps {
  className?: ClassValue;
  onStepChange: (step: number) => void;
}

export default function LaunchStepper({
  className,
  onStepChange,
}: LaunchStepperProps) {
  const { config } = useLaunch();
  const steps = [
    { title: "Token Config", description: "Configure basic token info", stepEnum: LaunchStep.Config },
    { title: "Preview Launch", description: "Preview token details" , stepEnum: LaunchStep.Deploy},
    { title: "Completed", description: "Token and pool created!", stepEnum: LaunchStep.Complete },
  ].map((step) => {
    let status = 'pending';
    if (config.lastCompletedStep >= step.stepEnum) {
      status = 'complete';
    } else if (config.lastCompletedStep + 1 === step.stepEnum) {
      status = 'current';
    } else if ((step.stepEnum > Math.max(config.lastCompletedStep, config.step)) || (config.status > TokenCreationStatus.Publishing)) {
      status = 'disabled';
    };

    return ({
    ...step,
    status,
  })});

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* Mobile view: Only show progress bars with numbers */}
      <div className="flex w-full md:hidden">
        <div className="flex w-full items-center gap-1 sm:gap-2">
          {steps.map((step, index) => (
            <div
              key={`mobile-step-${index}`}
              className={cn(
                "flex flex-1 cursor-pointer flex-col",
                step.status === 'disabled' &&
                  "cursor-not-allowed opacity-60",
              )}
              onClick={() => {
                if (step.status === 'disabled') {
                  return;
                }
                onStepChange(index);
              }}
            >
              <div className="relative">
                <div
                  className={cn(
                    "rounded-full h-1 w-full transition-colors",
                    step.status === 'complete'
                      ? "bg-success"
                      : step.status === 'current'
                        ? "bg-foreground"
                        : "bg-border hover:bg-border/80",
                  )}
                />
                {/* Small indicator showing current step or checkmark for completed */}
                {step.status === 'complete' ? (
                  <div className="rounded-full absolute -bottom-4 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center bg-success text-[10px] text-background">
                    ✓
                  </div>
                ) : step.status === 'current' ? (
                  <div className="rounded-full absolute -bottom-4 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center bg-foreground text-[10px] text-background">
                    {index + 1}
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
          {steps[config.step].title}
        </p>
        <p className="text-xs sm:text-sm text-center text-secondary-foreground">
          {steps[config.step].description}
        </p>
      </div>

      {/* Desktop view: Original stepper with full text */}
      <div className="hidden w-full flex-row items-center gap-4 md:flex">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className={cn(
              "flex flex-1 flex-col gap-2 cursor-pointer",
              step.status === 'disabled' &&
                "cursor-not-allowed opacity-60",
            )}
            onClick={() => {
              if (step.status === 'disabled') {
                return;
              }
              onStepChange(index);
            }}
          >
            <div
              className={cn(
                "rounded-full flex h-1 w-full transition-colors",
                step.status === 'complete'
                  ? "bg-success"
                  : step.status === 'current'
                    ? "bg-foreground"
                    : "cursor-pointer bg-border hover:bg-border/80",
              )}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <p className="text-p2 text-foreground">{step.title}</p>
                {step.status === 'complete' && (
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
