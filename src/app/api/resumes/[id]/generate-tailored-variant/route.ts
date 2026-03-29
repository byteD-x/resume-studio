import { NextRequest } from "next/server";
import { validateResumeDocument } from "@/lib/resume-document";
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    document?: unknown;
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
  const tailoredDocument = createTailoredVariantDocument(sourceDocument, {
    nextId: created.meta.id,
    nextTitle,
  });
  const savedDocument = await writeResumeDocument(tailoredDocument);

  return Response.json(
    {
      document: savedDocument,
      plan,
    },
    { status: 201 },
  );
}
