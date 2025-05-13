import {
  DevInspectResults,
  DynamicFieldPage,
  PaginatedEvents,
  PaginatedObjectsResponse,
  SuiClient,
  SuiEventFilter,
  SuiObjectDataOptions,
  SuiObjectResponse,
  SuiObjectResponseQuery,
  SuiParsedData,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import {
  Transaction,
  TransactionArgument,
  TransactionResult,
} from "@mysten/sui/transactions";

import {
  PhantomReified,
  Reified,
} from "../_codegen/_generated/_framework/reified";
import { OracleRegistry } from "../_codegen/_generated/oracles/oracles/structs";
import { Bank } from "../_codegen/_generated/steamm/bank/structs";
import {
  CpQuoter,
  CpQuoterFields,
} from "../_codegen/_generated/steamm/cpmm/structs";
import {
  OracleQuoter,
  OracleQuoterFields,
} from "../_codegen/_generated/steamm/omm/structs";
import {
  OracleQuoterV2,
  OracleQuoterV2Fields,
} from "../_codegen/_generated/steamm/omm_v2/structs";
import { Pool } from "../_codegen/_generated/steamm/pool/structs";
import { DataPage, PaginationArgs, SuiObjectIdType } from "../types";
import { extractGenerics } from "../utils";

/**
 * Represents a module for making RPC (Remote Procedure Call) requests.
 */
export class FullClient extends SuiClient {
  /**
   * Get events for a given query criteria
   * @param query
   * @param paginationArgs
   * @returns
   */
  async queryEventsByPage(
    query: SuiEventFilter,
    paginationArgs: PaginationArgs = "all",
  ): Promise<DataPage<any>> {
    let result: any = [];
    let hasNextPage = true;
    const queryAll = paginationArgs === "all";
    let nextCursor = queryAll ? null : paginationArgs.cursor;

    do {
      const res: PaginatedEvents = await this.queryEvents({
        query,
        cursor: nextCursor,
        limit: queryAll ? null : paginationArgs.limit,
      });
      if (res.data) {
        result = [...result, ...res.data];
        hasNextPage = res.hasNextPage;
        nextCursor = res.nextCursor;
      } else {
        hasNextPage = false;
      }
    } while (queryAll && hasNextPage);

    return { data: result, nextCursor, hasNextPage };
  }

  /**
   * Get all objects owned by an address
   * @param owner
   * @param query
   * @param paginationArgs
   * @returns
   */
  async getOwnedObjectsByPage(
    owner: string,
    query: SuiObjectResponseQuery,
    paginationArgs: PaginationArgs = "all",
  ): Promise<DataPage<any>> {
    let result: any = [];
    let hasNextPage = true;
    const queryAll = paginationArgs === "all";
    let nextCursor = queryAll ? null : paginationArgs.cursor;
    do {
      const res: PaginatedObjectsResponse = await this.getOwnedObjects({
        owner,
        ...query,
        cursor: nextCursor,
        limit: queryAll ? null : paginationArgs.limit,
      });
      if (res.data) {
        result = [...result, ...res.data];
        hasNextPage = res.hasNextPage;
        nextCursor = res.nextCursor;
      } else {
        hasNextPage = false;
      }
    } while (queryAll && hasNextPage);

    return { data: result, nextCursor, hasNextPage };
  }

  /**
   * Return the list of dynamic field objects owned by an object
   * @param parentId
   * @param paginationArgs
   * @returns
   */
  async getDynamicFieldsByPage(
    parentId: SuiObjectIdType,
    paginationArgs: PaginationArgs = "all",
  ): Promise<DataPage<any>> {
    let result: any = [];
    let hasNextPage = true;
    const queryAll = paginationArgs === "all";
    let nextCursor = queryAll ? null : paginationArgs.cursor;
    do {
      const res: DynamicFieldPage = await this.getDynamicFields({
        parentId,
        cursor: nextCursor,
        limit: queryAll ? null : paginationArgs.limit,
      });

      if (res.data) {
        result = [...result, ...res.data];
        hasNextPage = res.hasNextPage;
        nextCursor = res.nextCursor;
      } else {
        hasNextPage = false;
      }
    } while (queryAll && hasNextPage);

    return { data: result, nextCursor, hasNextPage };
  }

  /**
   * Batch get details about a list of objects. If any of the object ids are duplicates the call will fail
   * @param ids
   * @param options
   * @param limit
   * @returns
   */
  async batchGetObjects(
    ids: SuiObjectIdType[],
    options?: SuiObjectDataOptions,
    limit = 50,
  ): Promise<SuiObjectResponse[]> {
    let objectDataResponses: SuiObjectResponse[] = [];

    try {
      for (let i = 0; i < Math.ceil(ids.length / limit); i++) {
        const res = await this.multiGetObjects({
          ids: ids.slice(i * limit, limit * (i + 1)),
          options,
        });
        objectDataResponses = [...objectDataResponses, ...res];
      }
    } catch (error) {
      console.log(error);
    }

    return objectDataResponses;
  }

  /**
   * Calculates the gas cost of a transaction block.
   * @param {Transaction} tx - The transaction block to calculate gas for.
   * @returns {Promise<number>} - The estimated gas cost of the transaction block.
   * @throws {Error} - Throws an error if the sender is empty.
   */
  async calculationTxGas(tx: Transaction): Promise<number> {
    const { sender } = tx.blockData;

    if (sender === undefined) {
      throw Error("sdk sender is empty");
    }

    const devResult = await this.devInspectTransactionBlock({
      transactionBlock: tx,
      sender,
    });
    const { gasUsed } = devResult.effects;

    const estimateGas =
      Number(gasUsed.computationCost) +
      Number(gasUsed.storageCost) -
      Number(gasUsed.storageRebate);
    return estimateGas;
  }

  zeroCoin(tx: Transaction, coinType: string): TransactionResult {
    return tx.moveCall({
      target: `0x2::coin::zero`,
      typeArguments: [coinType],
    });
  }

  coinValue(
    tx: Transaction,
    coin: TransactionArgument,
    coinType: string,
  ): TransactionResult {
    return tx.moveCall({
      target: `0x2::coin::value`,
      typeArguments: [coinType],
      arguments: [coin],
    });
  }

  /**
   * Sends a transaction block after signing it with the provided keypair.
   *
   * @param {Ed25519Keypair | Secp256k1Keypair} keypair - The keypair used for signing the transaction.
   * @param {Transaction} tx - The transaction block to send.
   * @returns {Promise<SuiTransactionBlockResponse | undefined>} - The response of the sent transaction block.
   */
  async sendTransaction(
    keypair: Ed25519Keypair | Secp256k1Keypair,
    tx: Transaction,
  ): Promise<SuiTransactionBlockResponse | undefined> {
    try {
      const resultTxn: any = await this.signAndExecuteTransaction({
        transaction: tx,
        signer: keypair,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      return resultTxn;
    } catch (error) {
      console.log("error: ", error);
    }
    return undefined;
  }

  /**
   * Send a simulation transaction.
   * @param tx - The transaction block.
   * @param simulationAccount - The simulation account.
   * @param useDevInspect - A flag indicating whether to use DevInspect. Defaults to true.
   * @returns A promise that resolves to DevInspectResults or undefined.
   */
  async sendSimulationTransaction(
    tx: Transaction,
    simulationAccount: string,
    useDevInspect = true,
  ): Promise<DevInspectResults | undefined> {
    try {
      if (useDevInspect) {
        const simulateRes = await this.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: simulationAccount,
        });
        return simulateRes;
      }

      // If useDevInspect is false, manually construct the transaction for simulation.
      // const inputs = tx.inputs.map((input) => {
      //   const { type, value } = input
      //   if (type === 'object') {
      //     return Inputs.SharedObjectRef({
      //       objectId: value,
      //       initialSharedVersion: 0,
      //       mutable: true,
      //     })
      //   }
      //   return value
      // })

      // const kind = {
      //   ProgrammableTransaction: {
      //     inputs,
      //     transactions: tx,
      //   },
      // }
      // // Serialize the transaction using BCS.
      // const serialize = bcs.TransactionKind.serialize(kind, {
      //   maxSize: 131072,
      // }).toBytes()

      // const devInspectTxBytes = toB64(serialize)
      // // Send the request to DevInspect.
      // const res = await this.transport.request<DevInspectResults>({
      //   method: 'sui_devInspectTransactionBlock',
      //   params: [simulationAccount, devInspectTxBytes, null, null],
      // })
      // return res
    } catch (error) {
      console.log("devInspectTransactionBlock error", error);
    }

    return undefined;
  }

  /**
   * Get a pool object state by its ID
   * @param objectId - The ID of the pool
   * @returns Promise resolving to the pool state
   */
  async fetchConstantProductPool(
    objectId: SuiObjectIdType,
  ): Promise<Pool<string, string, CpQuoter, string>> {
    try {
      const object = await this.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data) {
        throw new Error(`Pool with ID ${objectId} not found or has no data`);
      }

      if (object.error) {
        throw new Error(`Error fetching pool: ${object.error}`);
      }

      if (!object.data.content) {
        throw new Error(`Unable to parse data for Pool with ID ${objectId}`);
      }

      if (!object.data.type) {
        throw new Error(`Unable to parse type for Pool with ID ${objectId}`);
      }

      const parsedData: SuiParsedData = object.data.content as SuiParsedData;
      const poolTypes = extractGenerics(object.data.type);

      const parsedTypes: [
        PhantomReified<string>,
        PhantomReified<string>,
        Reified<CpQuoter, CpQuoterFields>,
        PhantomReified<string>,
      ] = [
        {
          phantomType: poolTypes[0],
          kind: "PhantomReified",
        },
        {
          phantomType: poolTypes[1],
          kind: "PhantomReified",
        },
        CpQuoter.reified(),
        {
          phantomType: poolTypes[3],
          kind: "PhantomReified",
        },
      ];

      return Pool.fromSuiParsedData(parsedTypes, parsedData);
    } catch (error) {
      console.error("Error fetching CPMM pool:", error);
      throw error;
    }
  }

  async fetchOraclePool(
    objectId: SuiObjectIdType,
  ): Promise<Pool<string, string, OracleQuoter, string>> {
    try {
      const object = await this.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data) {
        throw new Error(`Pool with ID ${objectId} not found or has no data`);
      }

      if (object.error) {
        throw new Error(`Error fetching pool: ${object.error}`);
      }

      if (!object.data.content) {
        throw new Error(`Unable to parse data for Pool with ID ${objectId}`);
      }

      if (!object.data.type) {
        throw new Error(`Unable to parse type for Pool with ID ${objectId}`);
      }

      const parsedData: SuiParsedData = object.data.content as SuiParsedData;
      const poolTypes = extractGenerics(object.data.type);

      const parsedTypes: [
        PhantomReified<string>,
        PhantomReified<string>,
        Reified<OracleQuoter, OracleQuoterFields>,
        PhantomReified<string>,
      ] = [
        {
          phantomType: poolTypes[0],
          kind: "PhantomReified",
        },
        {
          phantomType: poolTypes[1],
          kind: "PhantomReified",
        },
        OracleQuoter.reified(),
        {
          phantomType: poolTypes[3],
          kind: "PhantomReified",
        },
      ];

      return Pool.fromSuiParsedData(parsedTypes, parsedData);
    } catch (error) {
      console.error("Error fetching oracle pool:", error);
      throw error;
    }
  }

  async fetchOracleV2Pool(
    objectId: SuiObjectIdType,
  ): Promise<Pool<string, string, OracleQuoterV2, string>> {
    try {
      const object = await this.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data) {
        throw new Error(`Pool with ID ${objectId} not found or has no data`);
      }

      if (object.error) {
        throw new Error(`Error fetching pool: ${object.error}`);
      }

      if (!object.data.content) {
        throw new Error(`Unable to parse data for Pool with ID ${objectId}`);
      }

      if (!object.data.type) {
        throw new Error(`Unable to parse type for Pool with ID ${objectId}`);
      }

      const parsedData: SuiParsedData = object.data.content as SuiParsedData;
      const poolTypes = extractGenerics(object.data.type);

      const parsedTypes: [
        PhantomReified<string>,
        PhantomReified<string>,
        Reified<OracleQuoterV2, OracleQuoterV2Fields>,
        PhantomReified<string>,
      ] = [
        {
          phantomType: poolTypes[0],
          kind: "PhantomReified",
        },
        {
          phantomType: poolTypes[1],
          kind: "PhantomReified",
        },
        OracleQuoterV2.reified(),
        {
          phantomType: poolTypes[3],
          kind: "PhantomReified",
        },
      ];

      return Pool.fromSuiParsedData(parsedTypes, parsedData);
    } catch (error) {
      console.error("Error fetching oracle V2 pool:", error);
      throw error;
    }
  }

  /**
   * Get a bank object strate by its ID
   * @param objectId - The ID of the bank
   * @returns Promise resolving to the bank state
   */
  async fetchBank(
    objectId: SuiObjectIdType,
  ): Promise<Bank<string, string, string>> {
    try {
      const object = await this.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data) {
        throw new Error(`Bank with ID ${objectId} not found or has no data`);
      }

      if (!object.data) {
        throw new Error(`Bank with ID ${objectId} not found or has no data`);
      }

      if (object.error) {
        throw new Error(`Error fetching bank: ${object.error}`);
      }

      if (!object.data.content) {
        throw new Error(`Unable to parse data for Bank with ID ${objectId}`);
      }

      if (!object.data.type) {
        throw new Error(`Unable to parse type for Bank with ID ${objectId}`);
      }

      const parsedData: SuiParsedData = object.data.content as SuiParsedData;
      const bankTypes = extractGenerics(object.data.type);

      const parsedTypes: [
        PhantomReified<string>,
        PhantomReified<string>,
        PhantomReified<string>,
      ] = [
        {
          phantomType: bankTypes[0],
          kind: "PhantomReified",
        },
        {
          phantomType: bankTypes[1],
          kind: "PhantomReified",
        },
        {
          phantomType: bankTypes[2],
          kind: "PhantomReified",
        },
      ];

      return Bank.fromSuiParsedData(parsedTypes, parsedData);
    } catch (error) {
      console.error("Error fetching bank:", error);
      throw error;
    }
  }

  async fetchOracleRegistry(
    objectId: SuiObjectIdType,
  ): Promise<OracleRegistry> {
    try {
      const object = await this.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!object.data) {
        throw new Error(
          `OracleRegistry with ID ${objectId} not found or has no data`,
        );
      }

      if (!object.data) {
        throw new Error(
          `OracleRegistry with ID ${objectId} not found or has no data`,
        );
      }

      if (object.error) {
        throw new Error(`Error fetching OracleRegistry: ${object.error}`);
      }

      if (!object.data.content) {
        throw new Error(
          `Unable to parse data for OracleRegistry with ID ${objectId}`,
        );
      }

      if (!object.data.type) {
        throw new Error(
          `Unable to parse type for OracleRegistry with ID ${objectId}`,
        );
      }

      const parsedData: SuiParsedData = object.data.content as SuiParsedData;

      return OracleRegistry.fromSuiParsedData(parsedData);
    } catch (error) {
      console.error("Error fetching oracle registry:", error);
      throw error;
    }
  }
}
