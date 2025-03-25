import Head from "next/head";

import BanksCard from "@/components/admin/BanksCard";
import CreatePoolCard from "@/components/admin/CreatePoolCard";

export default function AdminPage() {
  return (
    <>
      <Head>
        <title>STEAMM | Admin</title>
      </Head>

      <div className="flex w-full max-w-lg flex-col gap-8">
        <div className="flex w-full flex-col gap-6">
          <h1 className="text-h1 text-foreground">Admin</h1>

          <BanksCard />
          <CreatePoolCard />
        </div>
      </div>
    </>
  );
}
