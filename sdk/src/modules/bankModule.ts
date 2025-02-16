import { SuiTransactionBlockResponse } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { createBank } from "../base";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { SuiAddressType } from "../utils";

/**
 * Helper class to help interact with pools.
 */
export class BankModule implements IModule {
  protected _sdk: SteammSDK;

  constructor(sdk: SteammSDK) {
    this._sdk = sdk;
  }

  get sdk() {
    return this._sdk;
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
      bTokenTreasuryId: string;
      bTokenMetadataId: string;
      bTokenTokenType: string;
      coinType: string;
      coinMetaT: string;
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
        this.sdk.sdkOptions.suilend_config.config!.lendingMarketType,
      coinType: args.coinType,
      btokenType: args.bTokenTokenType,
      registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
      coinMetaT: args.coinMetaT,
      coinMetaBToken: args.bTokenMetadataId,
      btokenTreasury: args.bTokenTreasuryId,
      lendingMarket: this.sdk.sdkOptions.suilend_config.config!.lendingMarketId,
    };

    createBank(tx, callArgs, this.sdk.packageInfo());
  }
}
