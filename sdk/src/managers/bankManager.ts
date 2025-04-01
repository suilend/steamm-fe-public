import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, normalizeSuiAddress } from "@mysten/sui/utils";

import { bankScriptAbi, eventScriptAbi } from "../_codegen";
import { InitLendingArgs, createBank } from "../base";
import { castNeedsRebalance } from "../base/bank/bankTypes";
import { IManager } from "../interfaces/IManager";
import { SteammSDK } from "../sdk";
import { BankInfo, SuiObjectIdType, getBankFromId } from "../types";
import { SuiAddressType, chunk, zip } from "../utils";

/**
 * Helper class to help interact with banks.
 */
export class BankManager implements IManager {
  protected _sdk: SteammSDK;

  constructor(sdk: SteammSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
  }

  public async initLending(
    tx: Transaction,
    args: Omit<InitLendingArgs, "globalAdmin"> & { bankId: SuiAddressType },
  ) {
    const banks = await this.sdk.getBankData();
    const bankInfo = getBankFromId(banks, args.bankId);
    const bank = this.sdk.bankAbi(bankInfo);

    bank.initLending(tx, {
      globalAdmin: this.sdk.sdkOptions.steammConfig.config!.globalAdmin,
      targetUtilisationBps: args.targetUtilisationBps,
      utilisationBufferBps: args.utilisationBufferBps,
    });
  }

  public async rebalance(
    bankIds: SuiObjectIdType[],
    batchSize: number = 20,
  ): Promise<Transaction[]> {
    const batches = chunk(bankIds, batchSize);

    const txs = await Promise.all(
      batches.map((batch) => this.batchRebalance(batch)),
    );

    return txs;
  }

  public async getTotalFunds(bankInfo: BankInfo): Promise<bigint> {
    const tx = new Transaction();
    const bank = this.sdk.bankAbi(bankInfo);

    const bankObj = await this.sdk.fullClient.getObject({
      id: bankInfo.bankId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    // TODO: use fetchBank instead
    // const bankState = await this.sdk.fullClient.fetchBank(bankId);
    // const btokenAmount = bankState.btokenSupply.value;
    const btokenAmount = BigInt(
      (bankObj.data?.content as any).fields.btoken_supply.fields.value,
    );

    if (btokenAmount === undefined || btokenAmount === null) {
      throw new Error("btokenAmount is undefined or null");
    }

    bank.compoundInterestIfAny(tx);
    const totalFunds = bank.fromBtokens(tx, { btokenAmount });

    eventScriptAbi.emitEvent(
      tx,
      "u64",
      totalFunds,
      this.sdk.scriptPackageInfo().publishedAt,
    );

    return BigInt(await this.getDryResult<bigint>(tx, "u64"));
  }

  public async getEffectiveUtilisation(bankInfo: BankInfo): Promise<number> {
    const totalFunds = await this.getTotalFunds(bankInfo);

    const bankObj = await this.sdk.fullClient.getObject({
      id: bankInfo.bankId,
      options: {
        showContent: true,
        showType: true,
      },
    });

    const fundsAvailable = BigInt(
      (bankObj.data?.content as any).fields.funds_available,
    );

    const fundsDeployed = totalFunds - fundsAvailable;

    // (funds_deployed * 10_000) / (funds_available + funds_deployed)
    return Number(fundsDeployed) / Number(totalFunds);
  }

  public async queryRebalance(
    batchSize: number = 20,
  ): Promise<SuiAddressType[]> {
    const banks = Object.values(await this.sdk.getBankData());

    const batches = chunk(banks, batchSize);
    const batchResults = await Promise.all(
      batches.map((batch) => this.batchQueryRebalance(batch)),
    );

    return batchResults.flat();
  }

  public async createBToken(
    bytecode: any,
    sender: SuiAddressType,
  ): Promise<Transaction> {
    // Step 1: Create the coin
    const tx = new Transaction();
    const [upgradeCap] = tx.publish({
      modules: [[...bytecode]],
      dependencies: [normalizeSuiAddress("0x1"), normalizeSuiAddress("0x2")],
    });

    tx.transferObjects([upgradeCap], tx.pure.address(sender));

    return tx;
  }

  public async createBank(
    tx: Transaction,
    args: {
      coinType: string;
      coinMetaT: string;
      bTokenTreasuryId: string;
      bTokenTokenType: string;
      bTokenMetadataId: string;
    },
  ) {
    // // Step 2: Get the treasury Cap id from the transaction
    // const [bTokenTreasuryId, bTokenMetadataId, bTokenTokenType] =
    //   getTreasuryAndCoinMeta(publishTxResponse);

    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.fullClient.getObject({
        id: args.bTokenTreasuryId,
      });
      if (object.error) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        break;
      }
    }

    const callArgs = {
      lendingMarketType:
        this.sdk.sdkOptions.suilendConfig.config!.lendingMarketType,
      coinType: args.coinType,
      btokenType: args.bTokenTokenType,
      registry: this.sdk.sdkOptions.steammConfig.config!.registryId,
      coinMetaT: args.coinMetaT,
      coinMetaBToken: args.bTokenMetadataId,
      btokenTreasury: args.bTokenTreasuryId,
      lendingMarket: this.sdk.sdkOptions.suilendConfig.config!.lendingMarketId,
    };

    createBank(tx, callArgs, this.sdk.packageInfo());
  }

  private async batchRebalance(
    bankIds: SuiObjectIdType[],
  ): Promise<Transaction> {
    const tx = new Transaction();
    const banks = await this.sdk.getBankData();

    for (const bankId of bankIds) {
      const bankInfo = getBankFromId(banks, bankId);
      const bank = this.sdk.bankAbi(bankInfo);

      bank.rebalance(tx);
    }
    return tx;
  }

  private async batchQueryRebalance(
    banks: BankInfo[],
  ): Promise<SuiAddressType[]> {
    const tx = new Transaction();

    // Step 2: Check if any bank needs rebalancing
    for (const bankInfo of banks) {
      const bank = this.sdk.bankAbi(bankInfo);

      bank.compoundInterestIfAny(tx);

      bankScriptAbi.needsRebalance(
        tx,
        bank.typeArgs(),
        {
          bank: bank.bank(tx),
          lendingMarket: bank.lendingMarket(tx),
          clock: tx.object(SUI_CLOCK_OBJECT_ID),
        },
        this.sdk.scriptPackageInfo().publishedAt,
      );
    }

    const rebalancings = await this.getRebalanceQueryResult(tx);
    const banksToRebalance: string[] = [];

    for (const [bank, rebalanceOp] of zip(banks, rebalancings)) {
      if (rebalanceOp) {
        banksToRebalance.push(bank.bankId);
      }
    }

    return banksToRebalance;
  }

  private async getRebalanceQueryResult(tx: Transaction): Promise<boolean[]> {
    const quoteType = "NeedsRebalance";
    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
        additionalArgs: { showRawTxnDataAndEffects: true },
      },
    );

    if (inspectResults.error) {
      console.log("Failed to fetch rebalancing query");
      throw new Error(inspectResults.error);
    }

    const quoteEvents = inspectResults.events.filter((event) =>
      event.type.includes(quoteType),
    );

    if (quoteEvents.length === 0) {
      throw new Error(`Quote event of type ${quoteType} not found in events`);
    }

    const quoteResults = quoteEvents.map((quoteEvent) =>
      castNeedsRebalance((quoteEvent.parsedJson as any).event),
    );

    return quoteResults;
  }

  private async getDryResult<T>(
    tx: Transaction,
    eventType: string,
  ): Promise<T> {
    const inspectResults = await this.sdk.fullClient.devInspectTransactionBlock(
      {
        sender: this.sdk.senderAddress,
        transactionBlock: tx,
      },
    );

    if (inspectResults.error) {
      console.log(inspectResults);
      throw new Error("DevInspect Failed");
    }

    const event = inspectResults.events.find((event) =>
      event.type.includes(eventType),
    );

    if (!event) {
      throw new Error("Quote event not found");
    }

    const quoteResult = (event.parsedJson as any).event as T;
    return quoteResult;
  }

  public async setMinTokenBlockSize(
    tx: Transaction,
    args: {
      bankId: SuiObjectIdType;
      minTokenBlockSize: number | TransactionArgument;
    },
  ) {
    const banks = await this.sdk.getBankData();
    const bankInfo = getBankFromId(banks, args.bankId);
    const bank = this.sdk.bankAbi(bankInfo);

    bank.setMinimumTokenBlockSize(tx, {
      minTokenBlockSize: args.minTokenBlockSize,
      globalAdmin: this.sdk.sdkOptions.steammConfig.config!.globalAdmin,
    });
  }

  public async setUtilisation(
    tx: Transaction,
    args: {
      bankId: SuiObjectIdType;
      targetUtilisationBps: number | TransactionArgument;
      utilisationBufferBps: number | TransactionArgument;
    },
  ) {
    const banks = await this.sdk.getBankData();
    const bankInfo = getBankFromId(banks, args.bankId);
    const bank = this.sdk.bankAbi(bankInfo);

    bank.setUtilisationBps(tx, {
      targetUtilisationBps: args.targetUtilisationBps,
      utilisationBufferBps: args.utilisationBufferBps,
      globalAdmin: this.sdk.sdkOptions.steammConfig.config!.globalAdmin,
    });
  }
}
