import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import { validateResumeDocument } from "@/lib/resume-document";
import { generateRemoteResumeSummary } from "@/lib/resume-ai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    document?: unknown;
    apiKey?: string;
  };

  if (!body.document) {
    return new Response("Missing resume document.", { status: 400 });
  }

  try {
    const document = validateResumeDocument(body.document);
    const summary = await generateRemoteResumeSummary(document, body.apiKey);

    return Response.json({ summary }, { status: 200 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to generate remote summary.",
      { status: 400 },
    );
  }
}
