"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost: "btn btn-ghost",
  danger: "btn btn-danger",
} as const;

interface BaseProps {
  children: ReactNode;
  variant?: keyof typeof buttonVariants;
  className?: string;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;
type ButtonLinkProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(buttonVariants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants[variant], className)} href={href as Route} {...props}>
      {children}
    </Link>
  );
}
