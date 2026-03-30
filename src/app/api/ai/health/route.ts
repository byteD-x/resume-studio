import { NextRequest } from "next/server";
import { checkRemoteResumeAiConnection } from "@/lib/resume-ai";
import { resumeAiSettingsSchema } from "@/types/resume";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    apiKey?: string;
    settings?: unknown;
  };

  if (!body.settings) {
    return new Response("Missing AI settings.", { status: 400 });
  }

  try {
    const settings = resumeAiSettingsSchema.parse(body.settings);
    const result = await checkRemoteResumeAiConnection(settings, body.apiKey);
    return Response.json(result, { status: 200 });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "Failed to check AI connectivity.", {
      status: 400,
    });
  }
}
