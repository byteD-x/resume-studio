"use client";

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
  {
    href: "/resumes",
    label: "我的简历",
    match: (pathname: string) => pathname.startsWith("/resumes"),
  },
];

export function SiteHeader() {
  const pathname = usePathname();
  const navItems = baseNavItems;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="flex items-center gap-7">
          <Link className="site-brand" href="/">
            <span className="site-brand-mark">
              <FileText className="size-[18px]" />
            </span>
            <div className="leading-none">
              <p className="site-brand-title">简历工坊</p>
            </div>
          </Link>

          <nav className="site-nav">
            {navItems.map((item) => {
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
          <Link className="btn btn-primary" href="/templates">
            开始制作
          </Link>
        </div>
      </div>
    </header>
  );
}
