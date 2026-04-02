"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement>;

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-[var(--radius-md)] border border-[#d9e4f2] bg-white/92 px-4 text-[15px] text-[#1d2129] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#86909c] focus:border-[#9bbcff] focus:bg-white focus:shadow-[0_0_0_4px_rgba(22,93,255,0.12)] disabled:cursor-not-allowed disabled:opacity-55",
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  );
});

AuthInput.displayName = "AuthInput";

export { AuthInput };
