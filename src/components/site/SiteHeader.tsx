"use client";

import type { Route } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUserPublic } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/" as Route, label: "首页", match: (pathname: string) => pathname === "/" },
  { href: "/templates" as Route, label: "模板中心", match: (pathname: string) => pathname.startsWith("/templates") },
  { href: "/resumes" as Route, label: "草稿库", match: (pathname: string) => pathname.startsWith("/resumes") },
] as const;

export function SiteHeader({
  currentUser,
}: {
  currentUser: AuthUserPublic | null;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/studio/") || pathname.startsWith("/login")) {
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
          {currentUser ? (
            <>
              <div className="site-user-chip" title={currentUser.email}>
                <span aria-hidden="true" className="site-user-avatar">
                  {currentUser.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="site-user-copy">
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.email}</span>
                </div>
              </div>
              <Link className="btn btn-primary" href={"/templates" as Route}>
                <Plus className="size-4" />
                新建
              </Link>
              <form action={logoutAction}>
                <button className="btn btn-secondary" type="submit">
                  退出
                </button>
              </form>
            </>
          ) : (
            <Link className="btn btn-primary" href={"/login" as Route}>
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
