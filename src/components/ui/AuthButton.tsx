"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#165dff]/25 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-55",
  {
    variants: {
      variant: {
        default:
          "border-[#165dff] bg-[#165dff] text-white shadow-[0_12px_26px_rgba(22,93,255,0.2)] hover:border-[#3c7eff] hover:bg-[#3c7eff]",
        outline:
          "border-[#d9e4f2] bg-white/88 text-[#1d2129] hover:border-[#b6cffb] hover:bg-[#edf4ff]",
        ghost: "border-transparent bg-transparent text-[#4e5969] hover:bg-white/80 hover:text-[#1d2129]",
        secondary:
          "border-[#d9e4f2] bg-[#f7f8fa] text-[#1d2129] hover:border-[#c9d8f2] hover:bg-white",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 rounded-2xl px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface AuthButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const AuthButton = React.forwardRef<HTMLButtonElement, AuthButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);

AuthButton.displayName = "AuthButton";

export { AuthButton, buttonVariants as authButtonVariants };
