"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouteWarmup } from "@/components/product/useRouteWarmup";
import type { AuthUserPublic } from "@/lib/auth/types";

export function SiteFooter({
  currentUser,
}: {
  currentUser: AuthUserPublic | null;
}) {
  const pathname = usePathname();

  useRouteWarmup({
    includeLastResume: true,
    routes: ["/templates", "/resumes"],
  });

  if (pathname.startsWith("/studio/") || pathname.startsWith("/login")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">
          Resume Studio
          {currentUser ? ` · ${currentUser.name}` : ""}
        </p>
        <div className="site-footer-links">
          <Link href={"/templates" as Route}>模板中心</Link>
          <Link href={"/resumes" as Route}>草稿库</Link>
          <Link href={"/import" as Route}>导入起稿</Link>
        </div>
      </div>
    </footer>
  );
}
