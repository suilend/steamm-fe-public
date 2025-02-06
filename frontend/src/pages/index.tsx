import Head from "next/head";
import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import Countdown from "@/components/Countdown";
import { TITLE } from "@/lib/constants";

export default function Home() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
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
        ) : (
          <Countdown />
        )}
      </div>
    </>
  );
}
