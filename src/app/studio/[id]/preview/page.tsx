import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumePreviewPage } from "@/components/product/ResumePreviewPage";
import { requireAuthContext } from "@/lib/auth/dal";
import { buildResumeExportChecklist, buildResumeQualityReport } from "@/lib/resume-analysis";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { analyzeResumeTargeting } from "@/lib/resume-targeting";
import { listUserResumeSummaries, readUserResumeDocument } from "@/lib/user-storage";
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
  const auth = await requireAuthContext(`/studio/${id}/preview`);
  const document = await readUserResumeDocument(auth.user.id, id).catch(() => null);
  if (!document) {
    notFound();
  }
  const summaries = await listUserResumeSummaries(auth.user.id).catch(() => []);
  const lineage = buildResumeLineageMap(summaries).get(id) ?? null;

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
