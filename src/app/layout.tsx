import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getOptionalAuthContext } from "@/lib/auth/dal";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "简历工坊 | Resume Studio",
    template: "%s | 简历工坊",
  },
  description: "创建、编辑、预览和导出简历。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getOptionalAuthContext();

  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body>
        <div className="app-backdrop" />
        <div className="app-grid" />
        <div className="relative z-10 min-h-screen">
          <SiteHeader currentUser={auth?.user ?? null} />
          {children}
          <SiteFooter currentUser={auth?.user ?? null} />
        </div>
      </body>
    </html>
  );
}
