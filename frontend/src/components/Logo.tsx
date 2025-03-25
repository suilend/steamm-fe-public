import Image from "next/image";

import { ASSETS_URL } from "@/lib/constants";

export default function Logo() {
  return (
    <div className="flex flex-row items-center gap-2">
      <Image
        src={`${ASSETS_URL}/STEAMM.svg`}
        alt="STEAMM logo"
        width={24}
        height={24}
        quality={100}
      />
      <p className="text-p1 text-foreground">STEAMM</p>
    </div>
  );
}
