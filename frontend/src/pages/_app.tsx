import "@/lib/abortSignalPolyfill";
import type { AppProps } from "next/app";
import Head from "next/head";
import { PropsWithChildren, useEffect, useRef } from "react";

// import { registerWallet } from "@mysten/wallet-standard";
// import { createPhantom } from "@phantom/wallet-sdk";
import { datadogRum } from "@datadog/browser-rum";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { LDProvider } from "launchdarkly-react-client-sdk";
import mixpanel from "mixpanel-browser";

import {
  SettingsContextProvider,
  WalletContextProvider,
  useSettingsContext,
} from "@suilend/frontend-sui-next";

import Layout from "@/components/Layout";
import Toaster from "@/components/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppContextProvider } from "@/contexts/AppContext";
import { PointsContextProvider } from "@/contexts/PointsContext";
import { PoolPositionsContextProvider } from "@/contexts/PoolPositionsContext";
import { StatsContextProvider } from "@/contexts/StatsContext";
import { UserContextProvider } from "@/contexts/UserContext";
import { TITLE } from "@/lib/constants";
import { fontClassNames } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import "@/styles/globals.scss";

function WalletContextProviderWrapper({ children }: PropsWithChildren) {
  const { rpc } = useSettingsContext();

  // MSafe Wallet
  const didRegisterMsafeWalletRef = useRef<boolean>(false);
  useEffect(() => {
    if (didRegisterMsafeWalletRef.current) return;

    // registerWallet(new MSafeWallet("STEAMM", rpc.url, "sui:mainnet"));
    didRegisterMsafeWalletRef.current = true;
  }, [rpc.url]);

  return (
    <WalletContextProvider appName="STEAMM">{children}</WalletContextProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  // Mixpanel
  useEffect(() => {
    const projectToken = process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN;
    if (!projectToken) return;

    mixpanel.init(projectToken, {
      debug: process.env.NEXT_PUBLIC_DEBUG === "true",
      persistence: "localStorage",
    });
  }, []);

  // Datadog
  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_DD_APP_ID ||
      !process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN
    )
      return;

    datadogRum.init({
      applicationId: process.env.NEXT_PUBLIC_DD_APP_ID,
      clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
      site: "datadoghq.com",
      service: "steamm-fe",
      env: "prod",
      traceSampleRate: 100,
      profilingSampleRate: 100,
      telemetrySampleRate: 100,
      trackUserInteractions: true,
    });
  }, []);

  // Phantom
  // useEffect(() => {
  //   createPhantom({ hideLauncherBeforeOnboarded: true });
  // }, []);

  return (
    <>
      <SpeedInsights />
      <Analytics />
      <Head>
        <title>{TITLE}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
      </Head>

      <main id="__app_main" className={cn(fontClassNames)}>
        <LDProvider
          clientSideID={
            process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID as string
          }
        >
          <SettingsContextProvider>
            <WalletContextProviderWrapper>
              <AppContextProvider>
                <UserContextProvider>
                  <StatsContextProvider>
                    <PoolPositionsContextProvider>
                      <PointsContextProvider>
                        <TooltipProvider>
                          <Layout>
                            <Component {...pageProps} />
                          </Layout>
                          <Toaster />
                        </TooltipProvider>
                      </PointsContextProvider>
                    </PoolPositionsContextProvider>
                  </StatsContextProvider>
                </UserContextProvider>
              </AppContextProvider>
            </WalletContextProviderWrapper>
          </SettingsContextProvider>
        </LDProvider>
      </main>
    </>
  );
}
