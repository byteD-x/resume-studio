import { NextRequest } from "next/server";
import {
  deleteResumeDocument,
  ensureResumeDocument,
  readResumeDocument,
  writeResumeDocument,
} from "@/lib/storage";
import { validateResumeDocument } from "@/lib/resume-document";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await ensureResumeDocument(id, "主简历");
  return Response.json(document);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const input = validateResumeDocument(await request.json());
  const current = await readResumeDocument(id).catch(() => null);
  const nextDocument = await writeResumeDocument({
    ...input,
    meta: {
      ...input.meta,
      id,
      sourceRefs: Array.from(
        new Set([...(current?.meta.sourceRefs ?? []), ...input.meta.sourceRefs]),
      ),
    },
  });
  return Response.json(nextDocument);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await deleteResumeDocument(id);
  return new Response(null, { status: 204 });
}
