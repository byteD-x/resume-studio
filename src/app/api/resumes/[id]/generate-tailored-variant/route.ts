import { NextRequest } from "next/server";
import { validateResumeDocument } from "@/lib/resume-document";
import {
  applySummaryText,
  canUseRemoteResumeAi,
  generateRemoteResumeSummary,
  isLikelyLocalOllamaBaseUrl,
} from "@/lib/resume-ai";
import {
  buildTailoredVariantPlan,
  createTailoredVariantDocument,
} from "@/lib/resume-tailoring";
import {
  createResumeDocument,
  readResumeDocument,
  writeResumeDocument,
} from "@/lib/storage";

export const runtime = "nodejs";

function canGenerateRemoteSummary(apiKey?: string, baseUrl?: string) {
  if (apiKey?.trim()) return true;
  if (baseUrl && isLikelyLocalOllamaBaseUrl(baseUrl)) return true;

  return Boolean(
    process.env.RESUME_STUDIO_AI_API_KEY?.trim() ||
      process.env.OPENAI_COMPATIBLE_API_KEY?.trim() ||
      process.env.OPENAI_API_KEY?.trim(),
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    document?: unknown;
    apiKey?: string;
  };

  const sourceInput = body.document
    ? validateResumeDocument(body.document)
    : await readResumeDocument(id);
  const sourceDocument = {
    ...sourceInput,
    meta: {
      ...sourceInput.meta,
      id,
    },
  };
  const plan = buildTailoredVariantPlan(sourceDocument);

  if (!plan.canGenerate) {
    return new Response(
      "Add focus keywords or a job description before generating a tailored variant.",
      { status: 400 },
    );
  }

  const nextTitle = body.title?.trim() || plan.titleSuggestion;
  const created = await createResumeDocument(nextTitle);
  let tailoredDocument = createTailoredVariantDocument(sourceDocument, {
    nextId: created.meta.id,
    nextTitle,
  });

  let remoteSummaryApplied = false;
  let remoteSummaryError: string | null = null;

  if (canUseRemoteResumeAi(tailoredDocument.ai) && canGenerateRemoteSummary(body.apiKey, tailoredDocument.ai.baseUrl)) {
    try {
      const generatedSummary = await generateRemoteResumeSummary(tailoredDocument, body.apiKey);
      tailoredDocument = applySummaryText(tailoredDocument, generatedSummary);
      remoteSummaryApplied = true;
    } catch (error) {
      remoteSummaryError = error instanceof Error ? error.message : "Remote summary failed.";
    }
  }

  const savedDocument = await writeResumeDocument(tailoredDocument);

  return Response.json(
    {
      document: savedDocument,
      plan,
      remoteSummaryApplied,
      remoteSummaryError,
    },
    { status: 201 },
  );
}
