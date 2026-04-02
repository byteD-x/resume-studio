"use client";

import type { Route } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/" as Route, label: "首页", match: (pathname: string) => pathname === "/" },
  { href: "/templates" as Route, label: "模板中心", match: (pathname: string) => pathname.startsWith("/templates") },
  { href: "/resumes" as Route, label: "草稿库", match: (pathname: string) => pathname.startsWith("/resumes") },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  if (pathname.startsWith("/studio/")) {
    return null;
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="flex items-center gap-4 lg:gap-6">
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
                  href={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link className="btn btn-primary" href={"/templates" as Route}>
            <Plus className="size-4" />
            新建
          </Link>
        </div>
      </div>
    </header>
  );
}
