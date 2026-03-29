import { NextRequest } from "next/server";
import { createResumeDocument, listResumeSummaries } from "@/lib/storage";
import type { ResumeStarterPreset } from "@/lib/resume-document";
import type { ResumeWriterProfile } from "@/types/resume";

export const runtime = "nodejs";

export async function GET() {
  const documents = await listResumeSummaries();
  return Response.json(documents);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    starter?: ResumeStarterPreset;
    writerProfile?: ResumeWriterProfile;
  };
  const title = body.title?.trim() || "未命名简历";
  const starter = body.starter === "guided" ? "guided" : "blank";
  const writerProfile: ResumeWriterProfile =
    body.writerProfile === "campus" || body.writerProfile === "career-switch"
      ? body.writerProfile
      : "experienced";
  const document = await createResumeDocument(title, { starter, writerProfile });
  return Response.json(document, { status: 201 });
}
