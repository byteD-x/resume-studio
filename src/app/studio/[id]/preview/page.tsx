import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumePreviewPage } from "@/components/product/ResumePreviewPage";
import { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import { listResumeSummaries, readResumeDocument } from "@/lib/storage";
import { buildResumeWorkbenchReport } from "@/lib/resume-workbench";

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

  const qualityReport = buildResumeQualityReport(document);
  const targetingAnalysis = analyzeResumeTargeting(document);
  const workbenchReport = buildResumeWorkbenchReport(document, {
    qualityReport,
    targetingAnalysis,
  });
  const checklist = buildResumeExportChecklist(document, qualityReport);
  const html = buildResumePreviewHtml(document);

  return (
    <ResumePreviewPage
      checklist={checklist}
      html={html}
      initialDocument={document}
      lineage={lineage}
      qualityReport={qualityReport}
      targetingAnalysis={targetingAnalysis}
      workbenchReport={workbenchReport}
    />
  );
}
