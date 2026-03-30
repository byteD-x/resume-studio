import { NextRequest } from "next/server";
import { importPdfToResume } from "@/lib/pdf-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const resumeId = String(formData.get("resumeId") || "default");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new Response("Missing PDF file", { status: 400 });
  }

  const existingDocument = await ensureResumeDocument(resumeId, "未命名简历");
  const result = await importPdfToResume(Buffer.from(await file.arrayBuffer()), {
    existingDocument,
    resumeId,
  });

  await writeImportArtifact(resumeId, "pdf.raw.json", result.rawPdf);
  const document = await writeResumeDocument(result.document);
  return Response.json({ document });
}
