import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import { buildResumeQualityReport } from "@/lib/resume-analysis";
import { validateResumeDocument } from "@/lib/resume-document";
import { exportResumePdf } from "@/lib/pdf-export";
import { writeUserExportedPdf } from "@/lib/user-storage";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = validateResumeDocument(await request.json());
  const qualityReport = buildResumeQualityReport(document);
  if (qualityReport.blockingIssues.length > 0) {
    const message = qualityReport.blockingIssues[0]?.message ?? "Resume is not ready to export.";
    return new Response(message, { status: 400 });
  }
  const pdf = await exportResumePdf(document);
  await writeUserExportedPdf(auth.user.id, id, pdf);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${id}.pdf"`,
    },
  });
}
