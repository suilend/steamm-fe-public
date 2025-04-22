import { ClassValue } from "clsx";

import Parameter from "@/components/Parameter";
import TextInput from "@/components/TextInput";
import { cn } from "@/lib/utils";

interface TokenMetadataInfoProps {
  className?: ClassValue;
  description: string;
  onDescriptionChange: (value: string) => void;
  website: string;
  onWebsiteChange: (value: string) => void;
  twitter: string;
  onTwitterChange: (value: string) => void;
  telegram: string;
  onTelegramChange: (value: string) => void;
}

export default function TokenMetadataInfo({
  className,
  description,
  onDescriptionChange,
  website,
  onWebsiteChange,
  twitter,
  onTwitterChange,
  telegram,
  onTelegramChange,
}: TokenMetadataInfoProps) {
  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <Parameter label="Description">
        <TextInput
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter token description"
          multiline
        />
      </Parameter>

      <Parameter label="Website URL">
        <TextInput
          value={website}
          onChange={(e) => onWebsiteChange(e.target.value)}
          placeholder="Enter website URL"
        />
      </Parameter>

      <Parameter label="Twitter">
        <TextInput
          value={twitter}
          onChange={(e) => onTwitterChange(e.target.value)}
          placeholder="Enter Twitter handle"
        />
      </Parameter>

      <Parameter label="Telegram">
        <TextInput
          value={telegram}
          onChange={(e) => onTelegramChange(e.target.value)}
          placeholder="Enter Telegram handle"
        />
      </Parameter>
    </div>
  );
} 