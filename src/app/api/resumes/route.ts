import { NextRequest } from "next/server";
import { requireApiAuthContext } from "@/lib/auth/dal";
import { createUserResumeDocument, listUserResumeSummaries } from "@/lib/user-storage";
import type { ResumeStarterPreset } from "@/lib/resume-document";
import {
  normalizeResumeTemplateValue,
  type ResumeTemplate,
  type ResumeWriterProfile,
} from "@/types/resume";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await listUserResumeSummaries(auth.user.id);
  return Response.json(documents);
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuthContext();
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    starter?: string;
    writerProfile?: ResumeWriterProfile;
    template?: ResumeTemplate;
  };
  const title = body.title?.trim() || "未命名简历";
  const starter: ResumeStarterPreset =
    body.starter === "guided"
      ? "guided"
      : body.starter === "template" || body.starter === "template-sample"
        ? "template"
        : "blank";
  const writerProfile: ResumeWriterProfile =
    body.writerProfile === "campus" || body.writerProfile === "career-switch"
      ? body.writerProfile
      : "experienced";
  const template: ResumeTemplate = normalizeResumeTemplateValue(body.template) ?? "aurora-grid";
  const document = await createUserResumeDocument(auth.user.id, title, { starter, writerProfile, template });
  return Response.json(document, { status: 201 });
}
