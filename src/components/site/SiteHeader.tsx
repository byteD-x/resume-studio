"use client";

import type { Route } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/", label: "首页", match: (pathname: string) => pathname === "/" },
  {
    href: "/templates",
    label: "模板",
    match: (pathname: string) => pathname.startsWith("/templates"),
  },
];

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/studio/")) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="flex items-center gap-7">
          <Link className="site-brand" href="/">
            <span className="site-brand-mark">
              <FileText className="size-[18px]" />
            </span>
            <div className="leading-none">
              <p className="site-brand-title">Resume Studio</p>
            </div>
          </Link>

          <nav className="site-nav">
            {baseNavItems.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  className={cn("site-nav-link", active && "site-nav-link-active")}
                  href={item.href as Route}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link className="btn btn-primary" href={"/templates" as Route}>
            开始新简历
          </Link>
        </div>
      </div>
    </header>
  );
}
