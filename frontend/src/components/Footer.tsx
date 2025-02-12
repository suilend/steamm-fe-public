import Image from "next/image";
import Link from "next/link";

import Container from "@/components/Container";
import DiscordIcon from "@/components/icons/DiscordIcon";
import XIcon from "@/components/icons/XIcon";
import { SUILEND_ASSETS_URL } from "@/lib/constants";
import {
  DISCORD_URL,
  DOCS_URL,
  SUILEND_URL,
  TWITTER_URL,
} from "@/lib/navigation";

const FOOTER_HEIGHT = 48; // px

export default function Footer() {
  return (
    <div className="relative z-[2] w-full border-t">
      <Container>
        <div
          className="flex w-full flex-row justify-between gap-2"
          style={{ height: FOOTER_HEIGHT }}
        >
          {/* Powered by Suilend */}
          <div className="flex flex-row items-center gap-2">
            <Image
              className="h-4 w-4"
              src={`${SUILEND_ASSETS_URL}/Suilend.svg`}
              alt="Suilend logo"
              width={16}
              height={16}
              quality={100}
            />
            <Link
              className="text-p2 text-secondary-foreground transition-colors hover:text-foreground"
              href={SUILEND_URL}
              target="_blank"
            >
              Powered by Suilend
            </Link>
          </div>

          <div className="flex flex-row items-center gap-6">
            <Link
              className="text-p2 text-secondary-foreground transition-colors hover:text-foreground"
              href={DOCS_URL}
              target="_blank"
            >
              Docs
            </Link>

            <Link
              className="block text-secondary-foreground transition-colors hover:text-foreground"
              href={TWITTER_URL}
              target="_blank"
            >
              <XIcon className="h-4 w-4" />
            </Link>

            <Link
              className="block text-secondary-foreground transition-colors hover:text-foreground"
              href={DISCORD_URL}
              target="_blank"
            >
              <DiscordIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
