"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm" /><DialogPrimitive.Content className={cn("fixed left-1/2 top-1/2 z-[101] max-h-[94svh] w-[min(680px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-3xl border border-white/20 bg-[#0b0c09] p-6 text-white shadow-2xl", className)} {...props}>{children}<DialogPrimitive.Close aria-label="Close" className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-white/20 text-white"><X /></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
