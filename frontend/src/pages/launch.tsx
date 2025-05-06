import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useWalletContext } from "@suilend/frontend-sui-next";

import LaunchConfirmationDialog from "@/components/launch/LaunchConfirmationDialog";
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
  const [isOpen, setIsOpen] = useState(false);
  // State for icon upload
  const [iconFile, setIconFile] = useState<File | null>(null);

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    symbol: "",
    description: "",
    initialSupply: "",
    decimals: "",
    icon: "",
  });
  const [touched, setTouched] = useState({
    name: false,
    symbol: false,
    description: false,
    initialSupply: false,
    decimals: false,
    icon: false,
  });

  // Real-time validation state
  const [isValid, setIsValid] = useState({
    name: false,
    symbol: false,
    description: true, // Description is optional, so default to true
    initialSupply: false,
    decimals: true, // Default to true since we'll use a default value
    icon: true, // Icon is optional, so default to true
  });

  const { config, setConfig, setTempConfig, launchToken } = useLaunch();
  const { error } = config;

  // Submit
  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setTempConfig(null);
    const resetValues = {
      name: false,
      symbol: false,
      description: false,
      initialSupply: false,
      decimals: false,
      icon: false,
    };
    setTouched(resetValues);
    setIsValid(resetValues);
    setIconFile(null);
  };

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
    if (config.status === TokenCreationStatus.Pending) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (config.status > TokenCreationStatus.Publishing || config.error) {
      setIsOpen(false);
    }
  }, [config.status, config.error]);

  return (
    <>
      <LaunchConfirmationDialog isOpen={isOpen} setIsOpen={setIsOpen} />
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
            touched={touched}
            isValid={isValid}
            setTouched={setTouched}
            setIsValid={setIsValid}
            iconFile={iconFile}
            setIconFile={setIconFile}
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
