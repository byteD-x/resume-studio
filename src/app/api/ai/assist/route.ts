import { NextRequest } from "next/server";
import { validateResumeDocument } from "@/lib/resume-document";
import {
  generateRemoteItemSuggestions,
  generateRemoteSummarySuggestions,
} from "@/lib/resume-ai";
import {
  resumeSectionItemSchema,
  resumeSectionTypeSchema,
} from "@/types/resume";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    document?: unknown;
    mode?: "summary" | "section";
    sectionType?: unknown;
    item?: unknown;
    apiKey?: string;
  };

  if (!body.document) {
    return new Response("Missing resume document.", { status: 400 });
  }

  try {
    const document = validateResumeDocument(body.document);

    if (body.mode === "summary") {
      const suggestions = await generateRemoteSummarySuggestions(document, body.apiKey);
      return Response.json({ suggestions }, { status: 200 });
    }

    if (body.mode === "section") {
      const sectionType = resumeSectionTypeSchema.parse(body.sectionType);
      const item = resumeSectionItemSchema.parse(body.item);
      const suggestions = await generateRemoteItemSuggestions(document, sectionType, item, body.apiKey);
      return Response.json({ suggestions }, { status: 200 });
    }

    return new Response("Unsupported assist mode.", { status: 400 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Failed to generate remote assist suggestions.",
      { status: 400 },
    );
  }
}
