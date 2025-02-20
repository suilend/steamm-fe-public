import { Transaction } from "@mysten/sui/transactions";
import { normalizeSuiAddress } from "@mysten/sui/utils";

import { SuiAddressType } from "../../src";

import { createCoinBytecode } from "./coinGen";

const BTOKEN_URI = "TODO";
const LP_TOKEN_URI = "TODO";

export async function createBToken2(
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

export async function createLpToken2(
  coinASymbol: string,
  coinBSymbol: string,
  sender: SuiAddressType,
): Promise<Transaction> {
  // Construct LP token name
  const lpName = `STEAMM_LP ${coinASymbol}-${coinBSymbol}`;

  // Construct LP token symbol
  const lpSymbol = `STEAMM LP ${coinASymbol}-${coinBSymbol}`;

  // LP token description
  const lpDescription = "STEAMM LP Token";

  const structName = `STEAMM_LP_${coinASymbol}_${coinBSymbol}`;
  const moduleName = `steamm_lp_${coinASymbol}_${coinBSymbol}`;

  const bytecode = await createCoinBytecode(
    structName.toUpperCase().replace(/\s+/g, "_"),
    moduleName.toLowerCase().replace(/\s+/g, "_"),
    lpSymbol,
    lpName,
    lpDescription,
    LP_TOKEN_URI,
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
