import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumeEditorPage } from "@/components/product/ResumeEditorPage";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { listResumeSummaries, readResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑",
  description: "编辑内容与实时预览。",
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
    const [loadedDocument, summaries] = await Promise.all([
      readResumeDocument(id),
      listResumeSummaries(),
    ]);
    document = loadedDocument;
    lineage = buildResumeLineageMap(summaries).get(id) ?? null;
  } catch {
    notFound();
  }

  return <ResumeEditorPage initialDocument={document} lineage={lineage} />;
}
