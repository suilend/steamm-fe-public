import { CSSProperties } from "react";

import BigNumber from "bignumber.js";

import { Token, formatAddress, formatToken } from "@suilend/frontend-sui";
import { useSettingsContext } from "@suilend/frontend-sui-next";

import { Column } from "@/components/airdrop/AirdropAddressAmountTable";
import CopyToClipboardButton from "@/components/CopyToClipboardButton";
import OpenUrlNewTab from "@/components/OpenUrlNewTab";
import Tooltip from "@/components/Tooltip";

interface AirdropAddressAmountRowProps {
  columnStyleMap: Record<
    Column,
    { cell: CSSProperties; children: CSSProperties }
  >;
  token: Token;
  row: { address: string; amount: string };
}

export default function AirdropAddressAmountRow({
  columnStyleMap,
  token,
  row,
}: AirdropAddressAmountRowProps) {
  const { explorer } = useSettingsContext();

  return (
    <tr className="h-[calc(45px+1px)] border-x border-b bg-background">
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
                {formatAddress(row.address, 12)}
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
