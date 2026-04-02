import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import {
  deleteUserResumeDocuments,
  deleteUserResumeDocument,
  listUserResumeSummaries,
  readUserResumeDocument,
  writeUserResumeDocument,
} from "@/lib/user-storage";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { validateResumeDocument } from "@/lib/resume-document";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await readUserResumeDocument(auth.user.id, id).catch(() => null);

  if (!document) {
    return Response.json({ error: "Resume not found." }, { status: 404 });
  }

  return Response.json(document);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const input = validateResumeDocument(await request.json());
    const current = await readUserResumeDocument(auth.user.id, id).catch(() => null);
    const nextDocument = await writeUserResumeDocument(auth.user.id, {
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
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid resume payload." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const scope = request.nextUrl.searchParams.get("scope");

  if (scope === "lineage") {
    const summaries = await listUserResumeSummaries(auth.user.id);
    const lineage = buildResumeLineageMap(summaries).get(id);

    if (lineage && lineage.parentId === null) {
      await deleteUserResumeDocuments(auth.user.id, [id, ...lineage.childIds]);
      return new Response(null, { status: 204 });
    }
  }

  await deleteUserResumeDocument(auth.user.id, id);
  return new Response(null, { status: 204 });
}
