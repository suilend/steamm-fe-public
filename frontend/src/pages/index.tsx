import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import Countdown from "@/components/Countdown";
import { ASSETS_URL, TITLE } from "@/lib/constants";

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDev, setIsDev] = useState<boolean>(false);

  useEffect(() => {
    setIsDev(window.location.href.includes("localhost"));
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 250);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
      </Head>

      <div className="flex h-dvh w-full flex-col items-center justify-center">
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        ) : !isDev ? (
          <div className="flex w-max flex-col items-center gap-6">
            <Image
              src={`${ASSETS_URL}/STEAMM.svg?`}
              alt="STEAMM logo"
              width={64}
              height={64}
              quality={100}
            />

            <Countdown />
          </div>
        ) : (
          <p>real page</p>
        )}
      </div>
    </>
  );
}
