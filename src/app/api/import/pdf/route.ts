import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import { importPdfToResume } from "@/lib/pdf-import";
import { ensureUserResumeDocument, writeUserImportArtifact, writeUserResumeDocument } from "@/lib/user-storage";

export const runtime = "nodejs";

const MAX_IMPORT_PDF_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const existingDocument = await ensureUserResumeDocument(auth.user.id, resumeId, "未命名简历");
    const result = await importPdfToResume(Buffer.from(await file.arrayBuffer()), {
      existingDocument,
      resumeId,
    });

    await writeUserImportArtifact(auth.user.id, resumeId, "pdf.raw.json", result.rawPdf);
    const document = await writeUserResumeDocument(auth.user.id, result.document);
    return Response.json({ document });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "PDF import failed." },
      { status: 400 },
    );
  }
}
