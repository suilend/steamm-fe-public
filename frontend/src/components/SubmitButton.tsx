import { Check, Loader2 } from "lucide-react";

export type SubmitButtonState = {
  isLoading?: boolean;
  isSuccess?: boolean;
  isDisabled?: boolean;
  title?: string;
  description?: string;
};

interface SubmitButtonProps {
  submitButtonState: SubmitButtonState;
  onClick: () => void;
}

export default function SubmitButton({
  submitButtonState,
  onClick,
}: SubmitButtonProps) {
  return (
    <button
      className="flex h-14 w-full flex-col items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80 disabled:pointer-events-none disabled:opacity-50"
      disabled={submitButtonState.isDisabled}
      onClick={onClick}
    >
      {submitButtonState.isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-button-1-foreground" />
      ) : submitButtonState.isSuccess ? (
        <Check className="h-6 w-6 text-button-1-foreground" />
      ) : (
        <>
          <p className="text-p1 text-button-1-foreground">
            {submitButtonState.title}
          </p>
          {submitButtonState.description && (
            <p className="text-p3 text-button-1-foreground/75">
              {submitButtonState.description}
            </p>
          )}
        </>
      )}
    </button>
  );
}
