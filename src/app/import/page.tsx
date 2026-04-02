import { Metadata } from "next";
import { PortfolioImportWorkspace } from "@/components/import/PortfolioImportWorkspace";
import { requireAuthContext } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "导入起稿 | Resume Studio",
  description: "从网站、Markdown 或文本快速提取经历，生成简历草稿。",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireAuthContext("/import");

  return (
    <main className="page-wrap py-12">
      <section className="mb-10 text-center">
        <h1 className="mb-3 text-[2rem] font-bold tracking-tight text-[color:var(--ink-strong)]">
          导入经历
        </h1>
        <p className="mx-auto max-w-lg text-[1rem] text-[color:var(--ink-soft)]">
          粘贴你的人才主页、作品内容或上传 PDF，快速整理成当前账号下的简历草稿。
        </p>
      </section>

      <PortfolioImportWorkspace />
    </main>
  );
}
