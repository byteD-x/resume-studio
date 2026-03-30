"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/studio/")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">简历工坊</p>
        <div className="site-footer-links">
          <Link href="/templates">模板</Link>
          <Link href="/resumes">我的简历</Link>
        </div>
      </div>
    </footer>
  );
}
