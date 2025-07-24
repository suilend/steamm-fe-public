import { useState } from "react";

import { Transaction } from "@mysten/sui/transactions";
import { chunk } from "lodash";

import { getAllCoins, isSui } from "@suilend/sui-fe";
import { useSettingsContext, useWalletContext } from "@suilend/sui-fe-next";

import { showSuccessTxnToast } from "@/lib/toasts";

export default function MergePage() {
  const { explorer, suiClient } = useSettingsContext();
  const { address, signExecuteAndWaitForTransaction } = useWalletContext();

  const [coinType, setCoinType] = useState<string>("");

  const onMergeClick = async () => {
    if (!address) return;

    const allCoins = await getAllCoins(suiClient, address, coinType);
    if (allCoins.length <= 1) return;
    console.log("allCoins:", allCoins.length);

    const transaction = new Transaction();

    const mergeCoins = [];
    if (allCoins.length > 1) {
      const chunks = chunk(allCoins, 400);
      for (const chunk of chunks) {
        const mergeCoin = chunk[0];
        const x = transaction.mergeCoins(
          transaction.object(mergeCoin.coinObjectId),
          chunk.map((c) => transaction.object(c.coinObjectId)).slice(1),
        );
        mergeCoins.push(x);
      }
    }

    const res = await signExecuteAndWaitForTransaction(transaction);
    const txUrl = explorer.buildTxUrl(res.digest);

    showSuccessTxnToast(
      `Merged ${allCoins.length} coins into ${mergeCoins.length} coin${
        mergeCoins.length === 1 ? "" : "s"
      }`,
      txUrl,
      { description: coinType },
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <input
        className="w-full text-[black]"
        value={coinType}
        onChange={(e) => setCoinType(e.target.value)}
      />
      <button onClick={onMergeClick}>Merge</button>
    </div>
  );
}
