import { CSSProperties } from "react";

import BigNumber from "bignumber.js";

import {
  Token,
  formatAddress,
  formatInteger,
  formatToken,
} from "@suilend/sui-fe";
import { useSettingsContext } from "@suilend/sui-fe-next";

import { Column } from "@/components/airdrop/AirdropAddressAmountTable";
import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Tooltip from "@/components/Tooltip";
import { AirdropRow } from "@/lib/airdrop";

interface AirdropAddressAmountRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
  token: Token;
  row: AirdropRow;
}

export default function AirdropAddressAmountRow({
  columnStyleMap,
  token,
  row,
}: AirdropAddressAmountRowProps) {
  const { explorer } = useSettingsContext();

  return (
    <tr className="h-[calc(45px+1px)] border-x border-b bg-background">
      {/* Number */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.number.cell}
      >
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.number.children}
        >
          <div className="flex w-max flex-row items-center gap-2">
            <p className="text-p2 text-foreground">
              {formatInteger(row.number)}
            </p>
          </div>
        </div>
      </td>

      {/* Address */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.address.cell}
      >
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.address.children}
        >
          <div className="flex w-max flex-row items-center gap-2">
            <Tooltip title={row.address}>
              <p className="text-p2 text-foreground">
                {formatAddress(row.address, 8)}
              </p>
            </Tooltip>

            <div className="flex flex-row items-center gap-1">
              <CopyToClipboardButton value={row.address} />
              <OpenUrlNewTab
                url={explorer.buildAddressUrl(row.address)}
                tooltip={`Open on ${explorer.name}`}
              />
            </div>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td
        className="whitespace-nowrap align-middle"
        style={columnStyleMap.amount.cell}
      >
        <div
          className="flex min-w-max flex-row items-center"
          style={columnStyleMap.amount.children}
        >
          <div className="w-max">
            <p className="text-p2 text-foreground">
              {formatToken(new BigNumber(row.amount), { dp: token.decimals })}{" "}
              {token.symbol}
            </p>
          </div>
        </div>
      </td>
    </tr>
  );
}
