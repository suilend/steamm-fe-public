import { ReactNode } from "react";

export type SelectPopoverOption = {
  id: string;
  startDecorator?: ReactNode;
  name: string;
  description?: string;
  count?: number;
  endDecorator?: ReactNode;
};
