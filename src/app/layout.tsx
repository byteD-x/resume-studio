import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Studio | 简历工坊",
  description:
    "一套专门用于写简历的本地优先工作台，支持空白起稿、旧 PDF 导入、岗位定制、预览与 PDF 导出。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
