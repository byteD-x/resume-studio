import { NextRequest } from "next/server";
import { importPortfolioToResume } from "@/lib/portfolio-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    resumeId?: string;
    portfolioPath?: string;
  };
  const resumeId = body.resumeId?.trim() || "default";
  const existingDocument = await ensureResumeDocument(resumeId, "未命名简历");
  const result = await importPortfolioToResume({
    existingDocument,
    portfolioPath: body.portfolioPath,
    resumeId,
  });

  await writeImportArtifact(resumeId, "portfolio.raw.json", result.rawPortfolio);
  const document = await writeResumeDocument(result.document);
  return Response.json({ document, sourcePath: result.sourcePath });
}
