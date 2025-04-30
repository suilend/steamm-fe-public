import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

import { useWalletContext } from "@suilend/frontend-sui-next";

import TokenBasicInfo, { FormErrors } from "@/components/launch/TokenBasicInfo";
import TokenCreationProgress from "@/components/launch/TokenCreationProgress";
import SubmitButton, { SubmitButtonState } from "@/components/SubmitButton";
import LaunchContextProvider, {
  DEFAULT_CONFIG,
  TokenCreationStatus,
  useLaunch,
} from "@/contexts/LaunchContext";
import { POOL_URL_PREFIX } from "@/lib/navigation";

function LaunchPage() {
  const { address } = useWalletContext();

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
  const { error } = config;

  // Submit
  const reset = () => {
    setConfig(DEFAULT_CONFIG);
  };

  // const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitButtonState: SubmitButtonState = (() => {
    if (!address) return { isDisabled: true, title: "Connect wallet" };
    if (Object.values(errors).some((error) => error !== ""))
      return { isDisabled: true, title: "There was an error" };
    if (!!error) return { isDisabled: false, title: "Retry" };

    return { isDisabled: false, title: "Deploy" };
  })();

  const onSubmitClick = () => {
    document.getElementById("progress-container")?.scrollIntoView();
    if (error) setConfig({ ...config, error: null });

    launchToken();
  };

  return (
    <>
      <Head>
        <title>STEAMM | Launch</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Launch</h1>
        </div>

        <div className="flex w-full flex-col gap-4">
          <TokenBasicInfo
            config={config}
            setConfig={setConfig}
            setErrors={setErrors}
            errors={errors}
          />

          {config.status !== TokenCreationStatus.Pending && (
            <div id="progress-container" className="w-full">
              <TokenCreationProgress />
            </div>
          )}

          {config.status !== TokenCreationStatus.Success ? (
            <SubmitButton
              submitButtonState={submitButtonState}
              onClick={onSubmitClick}
            />
          ) : (
            <Link
              className="flex h-14 w-full flex-row items-center justify-center rounded-md bg-button-1 px-3 transition-colors hover:bg-button-1/80"
              href={`${POOL_URL_PREFIX}/${config.poolId}`}
              target="_blank"
            >
              <p className="text-p1 text-button-1-foreground">Go to pool</p>
            </Link>
          )}

          {/* Reset */}
          <button
            className="group flex h-10 w-full flex-row items-center justify-center rounded-md border px-3 transition-colors hover:bg-border/50"
            onClick={reset}
          >
            <p className="text-p2 text-secondary-foreground transition-colors group-hover:text-foreground">
              Start over
            </p>
          </button>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <LaunchContextProvider>
      <LaunchPage />
    </LaunchContextProvider>
  );
}
