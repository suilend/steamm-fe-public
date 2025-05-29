import Image from "next/image";

import { SUILEND_ASSETS_URL } from "@/lib/constants";

interface SwitchboardLogoProps {
  size: number;
}

export default function SwitchboardLogo({ size }: SwitchboardLogoProps) {
  return (
    <Image
      src={`${SUILEND_ASSETS_URL}/partners/Switchboard.png`}
      alt="Switchboard logo"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      quality={100}
    />
  );
}
