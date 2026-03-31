import { NextRequest } from "next/server";
import { importPdfToResume } from "@/lib/pdf-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_IMPORT_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resumeId = String(formData.get("resumeId") || "default");
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return new Response("Missing PDF file", { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_IMPORT_PDF_BYTES) {
      return new Response("PDF file size must be between 1 byte and 10 MB.", { status: 400 });
    }

    if (file.type && file.type !== "application/pdf") {
      return new Response("Only PDF files can be imported.", { status: 400 });
    }

    const existingDocument = await ensureResumeDocument(resumeId, "未命名简历");
    const result = await importPdfToResume(Buffer.from(await file.arrayBuffer()), {
      existingDocument,
      resumeId,
    });

    await writeImportArtifact(resumeId, "pdf.raw.json", result.rawPdf);
    const document = await writeResumeDocument(result.document);
    return Response.json({ document });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "PDF import failed." },
      { status: 400 },
    );
  }
}
