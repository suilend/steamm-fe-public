import { SuiClient } from "@mysten/sui/client";

export const getAllOwnedObjects = async (
  suiClient: SuiClient,
  address: string,
) => {
  const allObjs = [];
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
