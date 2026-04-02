import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import {
  buildOptimizedResumeTitle,
  createOptimizedResumeDocument,
} from "@/lib/resume-derivatives";
import { validateResumeDocument } from "@/lib/resume-document";
import type { ResumeOptimizationGoal } from "@/lib/resume-layout";
import {
  createUserResumeDocument,
  readUserResumeDocument,
  writeUserResumeDocument,
} from "@/lib/user-storage";

export const runtime = "nodejs";

function resolveOptimizationGoal(value: unknown): ResumeOptimizationGoal {
  return value === "one-page" ? "one-page" : "two-page";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    goal?: unknown;
    document?: unknown;
  };
  const goal = resolveOptimizationGoal(body.goal);

  const sourceInput = body.document
    ? validateResumeDocument(body.document)
    : await readUserResumeDocument(auth.user.id, id);
  const sourceDocument = {
    ...sourceInput,
    meta: {
      ...sourceInput.meta,
      id,
    },
  };

  const nextTitle = body.title?.trim() || buildOptimizedResumeTitle(sourceDocument, goal);
  const created = await createUserResumeDocument(auth.user.id, nextTitle);
  const optimizedDocument = createOptimizedResumeDocument(sourceDocument, {
    nextId: created.meta.id,
    nextTitle,
    goal,
  });
  const savedDocument = await writeUserResumeDocument(auth.user.id, optimizedDocument);

  return Response.json(
    {
      document: savedDocument,
      checklist: savedDocument.importTrace.pendingReview,
    },
    { status: 201 },
  );
}
