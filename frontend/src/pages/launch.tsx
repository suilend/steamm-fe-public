import Head from "next/head";

import LaunchTokenCard from "@/components/launch/LaunchTokenCard";

export default function LaunchPage() {
  return (
    <>
      <Head>
        <title>STEAMM | Launch</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Launch</h1>
        </div>

        <LaunchTokenCard />
      </div>
    </>
  );
}
