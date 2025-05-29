import Image from "next/image";

import { SUILEND_ASSETS_URL } from "@/lib/constants";

interface PythLogoProps {
  size: number;
}

export default function PythLogo({ size }: PythLogoProps) {
  return (
    <Image
      src={`${SUILEND_ASSETS_URL}/partners/Pyth.png`}
      alt="Pyth logo"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      quality={100}
    />
  );
}
