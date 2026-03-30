import { Metadata } from "next";
import { PortfolioImportWorkspace } from "@/components/import/PortfolioImportWorkspace";

export const metadata: Metadata = {
  title: "导入作品集 | Resume Studio",
  description: "从网站、Markdown 或文本快速提取经历，生成简历草稿。",
};

export default function ImportPage() {
  return (
    <main className="page-wrap py-12">
      <section className="text-center mb-10">
        <h1 className="text-[2rem] font-bold tracking-tight text-[color:var(--ink-strong)] mb-3">
          导入经历
        </h1>
        <p className="text-[1rem] text-[color:var(--ink-soft)] max-w-lg mx-auto">
          粘贴您的个人主页或已有资料。我们会智能提取核心经历、技能与项目，自动为您构建专属草稿。
        </p>
      </section>
      
      <PortfolioImportWorkspace />
    </main>
  );
}
