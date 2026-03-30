import { NextRequest } from "next/server";
import { importPortfolioToResume } from "@/lib/portfolio-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "@/lib/storage";
import { resumeAiSettingsSchema } from "@/types/resume";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    resumeId?: string;
    source?: "url" | "markdown" | "text";
    payload?: string;
    aiSettings?: {
      provider?: "local" | "openai-compatible";
      model?: string;
      baseUrl?: string;
    };
    apiKey?: string;
    urlOptions?: {
      includeLinkedPages?: boolean;
      maxPages?: number;
    };
  };

  if (!body.source || !body.payload) {
    return Response.json({ error: "Missing source or payload parameters." }, { status: 400 });
  }

  const { createId } = await import("@/lib/utils");
  const resumeId = body.resumeId?.trim() || createId("doc");
  const existingDocument = await ensureResumeDocument(resumeId, "简历草稿");
  const aiSettings = body.aiSettings ? resumeAiSettingsSchema.parse(body.aiSettings) : undefined;

  try {
    const result = await importPortfolioToResume({
      existingDocument,
      source: body.source,
      payload: body.payload,
      resumeId,
      aiSettings,
      apiKey: body.apiKey,
      urlOptions: body.urlOptions,
    });

    await writeImportArtifact(resumeId, "portfolio.raw.json", result.rawPortfolio);
    const document = await writeResumeDocument(result.document);

    return Response.json({ document, sourcePath: result.sourcePath, urlSummary: result.urlSummary });
  } catch (error) {
    console.error("Portfolio Import Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "导入处理失败" },
      { status: 500 }
    );
  }
}
