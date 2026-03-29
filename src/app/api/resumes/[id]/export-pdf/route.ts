import { NextRequest } from "next/server";
import { buildResumeQualityReport } from "@/lib/resume-analysis";
import { validateResumeDocument } from "@/lib/resume-document";
import { exportResumePdf } from "@/lib/pdf-export";
import { writeExportedPdf } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = validateResumeDocument(await request.json());
  const qualityReport = buildResumeQualityReport(document);
  if (qualityReport.blockingIssues.length > 0) {
    const message = qualityReport.blockingIssues[0]?.message ?? "Resume is not ready to export.";
    return new Response(message, { status: 400 });
  }
  const pdf = await exportResumePdf(document);
  await writeExportedPdf(id, pdf);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slugify(document.meta.title)}.pdf"`,
    },
  });
}
