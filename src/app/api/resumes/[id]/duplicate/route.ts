import { NextRequest } from "next/server";
import { duplicateResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { title?: string };

  try {
    const duplicated = await duplicateResumeDocument(id, body.title);
    return Response.json(duplicated, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to duplicate resume." },
      { status: 404 },
    );
  }
}
