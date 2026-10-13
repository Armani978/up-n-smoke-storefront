import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-black uppercase tracking-[0.08em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--acid)] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-[var(--acid)] px-5 py-3 text-[var(--ink)] shadow-[0_0_0_1px_var(--ink)] hover:-translate-y-0.5 hover:shadow-[0_5px_0_var(--ink)]",
        dark: "bg-[var(--ink)] px-5 py-3 text-white hover:bg-[var(--olive)]",
        outline: "border border-current bg-transparent px-5 py-3 hover:bg-current hover:text-[var(--paper)]",
        ghost: "px-3 py-2 hover:bg-black/5",
        danger: "bg-red-600 px-5 py-3 text-white hover:bg-red-700",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-4 text-xs",
        lg: "h-14 px-7 text-base",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
