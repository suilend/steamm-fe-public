import {
  SuiObjectChange,
  SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { Transaction, TransactionArgument } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import {
  Bank,
  Pool,
  PoolDepositLiquidityArgs,
  PoolQuoteDepositArgs,
  PoolQuoteRedeemArgs,
  PoolQuoteSwapArgs,
  PoolRedeemLiquidityArgs,
  PoolScript,
  PoolSwapArgs,
  SwapQuote,
  createBank,
  createPool,
} from "../base";
import {
  DepositQuote,
  RedeemQuote,
  castDepositQuote,
  castRedeemQuote,
  castSwapQuote,
} from "../base/pool/poolTypes";
import { createCoinBytecode, getTreasuryAndCoinMeta } from "../coinGen";
import { IModule } from "../interfaces/IModule";
import { SteammSDK } from "../sdk";
import { BankInfo, BankList, PoolInfo } from "../types";
import { SuiTypeName } from "../utils";
import { SuiAddressType } from "../utils";

const BTOKEN_URI = "TODO";

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
    coinType: string,
    coinSymbol: string,
    sender: SuiAddressType,
  ): Promise<Transaction> {
    // Construct LP token name
    const moduleName = coinType.split("::")[1];
    const structType = coinType.split("::")[2];

    const bModuleName = `b_${moduleName}`;
    const bstructType = `B_${structType}`;

    const bTokenName = `bToken ${coinSymbol}`;

    // Construct LP token symbol
    const bTokenSymbol = `b${coinSymbol}`;

    // LP token description
    const lpDescription = "Steamm bToken";

    const bytecode = await createCoinBytecode(
      bstructType,
      bModuleName,
      bTokenSymbol,
      bTokenName,
      lpDescription,
      BTOKEN_URI,
    );

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
    publishTxResponse: SuiTransactionBlockResponse,
    args: {
      coinType: string;
      coinMetaT: string;
    },
  ) {
    // Step 2: Get the treasury Cap id from the transaction
    const [bTokenTreasuryId, bTokenMetadataId, bTokenTokenType] =
      getTreasuryAndCoinMeta(publishTxResponse);

    // wait until the sui rpc recognizes the treasuryCapId
    while (true) {
      const object = await this.sdk.fullClient.getObject({
        id: bTokenTreasuryId,
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
      btokenType: bTokenTokenType,
      registry: this.sdk.sdkOptions.steamm_config.config!.registryId,
      coinMetaT: args.coinMetaT,
      coinMetaBToken: bTokenMetadataId,
      btokenTreasury: bTokenTreasuryId,
      lendingMarket: this.sdk.sdkOptions.suilend_config.config!.lendingMarketId,
    };

    createBank(tx, callArgs, this.sdk.packageInfo());
  }
}
