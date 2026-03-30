import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import "./globals.css";

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const headingFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "简历工坊 | Resume Studio",
    template: "%s | 简历工坊",
  },
  description: "创建、编辑、预览和导出简历。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <div className="app-backdrop" />
        <div className="app-grid" />
        <div className="relative z-10 min-h-screen">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
