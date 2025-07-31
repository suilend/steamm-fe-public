import { ReactNode } from "react";

export type SelectPopoverOption = {
  id: string;
  name: string;
  description?: string;
  count?: number;
  endDecorator?: ReactNode;
};
