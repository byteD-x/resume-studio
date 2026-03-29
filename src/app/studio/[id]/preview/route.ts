import { buildResumePreviewHtml } from "@/lib/resume-preview";
import { readResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const document = await readResumeDocument(id);

  return new Response(buildResumePreviewHtml(document), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
