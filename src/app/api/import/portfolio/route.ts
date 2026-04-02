import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import { importPortfolioToResume } from "@/lib/portfolio-import";
import { ensureUserResumeDocument, writeUserImportArtifact, writeUserResumeDocument } from "@/lib/user-storage";
import { resumeAiSettingsSchema } from "@/types/resume";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const existingDocument = await ensureUserResumeDocument(auth.user.id, resumeId, "简历草稿");

  try {
    const aiSettings = body.aiSettings ? resumeAiSettingsSchema.parse(body.aiSettings) : undefined;
    const result = await importPortfolioToResume({
      existingDocument,
      source: body.source,
      payload: body.payload,
      resumeId,
      aiSettings,
      apiKey: body.apiKey,
      urlOptions: body.urlOptions,
    });

    await writeUserImportArtifact(auth.user.id, resumeId, "portfolio.raw.json", result.rawPortfolio);
    const document = await writeUserResumeDocument(auth.user.id, result.document);

    return Response.json({ document, sourcePath: result.sourcePath, urlSummary: result.urlSummary });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "导入处理失败" },
      { status: 400 },
    );
  }
}
