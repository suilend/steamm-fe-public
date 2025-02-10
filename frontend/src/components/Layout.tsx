import Image from "next/image";
import { PropsWithChildren } from "react";

import { Loader2 } from "lucide-react";

import Container from "@/components/Container";
import Countdown from "@/components/Countdown";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { useAppContext } from "@/contexts/AppContext";
import { ASSETS_URL } from "@/lib/constants";

export default function Layout({ children }: PropsWithChildren) {
  const { appData } = useAppContext();

  return (
    <div className="relative z-[1] flex min-h-dvh w-full flex-col">
      {!appData ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
      ) : process.env.NEXT_PUBLIC_ENVIRONMENT === "production" ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-6">
          <Image
            src={`${ASSETS_URL}/STEAMM.svg`}
            alt="STEAMM logo"
            width={64}
            height={64}
            quality={100}
          />

          <Countdown />
        </div>
      ) : (
        <>
          <Nav />

          <Container className="relative z-[1] flex-1 py-4 md:py-6">
            {children}
          </Container>

          <Footer />
        </>
      )}
    </div>
  );
}
