import { NextRequest } from "next/server";
import { importPortfolioToResume } from "@/lib/portfolio-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    resumeId?: string;
    source?: "url" | "markdown" | "text";
    payload?: string;
  };

  if (!body.source || !body.payload) {
    return Response.json({ error: "Missing source or payload parameters." }, { status: 400 });
  }

  const { createId } = await import("@/lib/utils");
  const resumeId = body.resumeId?.trim() || createId("doc");
  const existingDocument = await ensureResumeDocument(resumeId, "简历草稿");

  try {
    const result = await importPortfolioToResume({
      existingDocument,
      source: body.source,
      payload: body.payload,
      resumeId,
    });

    await writeImportArtifact(resumeId, "portfolio.raw.json", result.rawPortfolio);
    const document = await writeResumeDocument(result.document);

    return Response.json({ document, sourcePath: result.sourcePath });
  } catch (error) {
    console.error("Portfolio Import Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "导入处理失败" },
      { status: 500 }
    );
  }
}
