import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumePreviewPage } from "@/components/product/ResumePreviewPage";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { listResumeSummaries, readResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "预览",
  description: "预览并导出 PDF。",
};

export default async function ResumePreviewRoutePage({
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

  return <ResumePreviewPage initialDocument={document} lineage={lineage} />;
}
