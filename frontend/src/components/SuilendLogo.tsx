import Image from "next/image";

import { SUILEND_ASSETS_URL } from "@/lib/constants";

interface SuilendLogoProps {
  size: number;
}

export default function SuilendLogo({ size }: SuilendLogoProps) {
  return (
    <Image
      src={`${SUILEND_ASSETS_URL}/Suilend.svg`}
      alt="Suilend logo"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      quality={100}
    />
  );
}
