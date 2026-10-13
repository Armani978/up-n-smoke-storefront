import type * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-black/15 bg-white px-4 text-sm text-[var(--ink)] outline-none transition placeholder:text-black/35 focus:border-[var(--olive)] focus:ring-4 focus:ring-[var(--acid)]/25 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
