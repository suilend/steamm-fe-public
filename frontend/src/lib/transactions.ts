import {
  SuiClient,
  SuiObjectResponse,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";

export const getAllOwnedObjects = async (
  suiClient: SuiClient,
  address: string,
): Promise<SuiObjectResponse[]> => {
  const allObjs: SuiObjectResponse[] = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const objs = await suiClient.getOwnedObjects({
      owner: address,
      cursor,
      options: { showContent: true },
    });

    allObjs.push(...objs.data);
    cursor = objs.nextCursor;
    hasNextPage = objs.hasNextPage;
  }

  return allObjs;
};

export const getMostRecentFromAddressTransaction = async (
  suiClient: SuiClient,
  address: string,
): Promise<SuiTransactionBlockResponse | undefined> => {
  const allTransactions: SuiTransactionBlockResponse[] = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const transactions = await suiClient.queryTransactionBlocks({
      filter: { FromAddress: address },
      cursor,
      limit: 1,
      order: "descending",
      options: {
        showEvents: true,
      },
    });

    allTransactions.push(...transactions.data);
    cursor = transactions.nextCursor;
    hasNextPage = transactions.hasNextPage;
  }

  return allTransactions[0];
};
