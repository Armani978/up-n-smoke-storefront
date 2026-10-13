import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]", className)}
      {...props}
    />
  );
}
