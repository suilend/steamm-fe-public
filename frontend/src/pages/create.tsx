import Head from "next/head";

import CreatePoolCard from "@/components/admin/pools/CreatePoolCard";

export default function CreatePage() {
  return (
    <>
      <Head>
        <title>STEAMM | Create</title>
      </Head>

      <div className="flex w-full max-w-md flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Create</h1>
        </div>

        <CreatePoolCard noWhitelist />
      </div>
    </>
  );
}
