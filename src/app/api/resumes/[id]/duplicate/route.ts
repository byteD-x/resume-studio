import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import { duplicateUserResumeDocument } from "@/lib/user-storage";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { title?: string };

  try {
    const duplicated = await duplicateUserResumeDocument(auth.user.id, id, body.title);
    return Response.json(duplicated, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate resume." },
      { status: 404 },
    );
  }
}
