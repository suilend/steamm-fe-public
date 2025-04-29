import { ChevronLeft } from "lucide-react";

import { LaunchStep } from "@/contexts/LaunchContext";

import TokenCreationContent from "./TokenCreationContent";
import TokenCreationProgress from "./TokenCreationProgress";

export default function TokenCreationForm({
  onStepChange,
}: {
  onStepChange: (step: number) => void;
}) {
  return (
    <>
      <div className="flex w-full flex-col justify-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onStepChange(LaunchStep.Config)}
            className="group flex h-10 w-10 items-center justify-center rounded-md border hover:bg-border/50"
          >
            <ChevronLeft className="h-5 w-5 text-secondary-foreground transition-colors group-hover:text-foreground" />
          </button>
          <h1 className="text-h1 text-foreground">Deploy your token</h1>
        </div>
        <TokenCreationProgress />
      </div>
      <TokenCreationContent />
    </>
  );
}
