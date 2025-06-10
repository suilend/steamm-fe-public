import Head from "next/head";

import AirdropCard from "@/components/airdrop/AirdropCard";

export default function AirdropPage() {
  return (
    <>
      <Head>
        <title>STEAMM | Airdrop</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Airdrop</h1>
        </div>

        <AirdropCard />
      </div>
    </>
  );
}
