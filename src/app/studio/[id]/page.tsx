import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumeEditorPage } from "@/components/product/ResumeEditorPage";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { listResumeSummaries, readResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑",
  description: "修改内容并预览。",
};

export default async function ResumeStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let document;
  let lineage = null;

  try {
    document = await readResumeDocument(id);
    const summaries = await listResumeSummaries();
    lineage = buildResumeLineageMap(summaries).get(id) ?? null;
  } catch {
    notFound();
  }

  return <ResumeEditorPage initialDocument={document} lineage={lineage} />;
}
