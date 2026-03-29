import { StudioPage } from "@/components/studio/StudioPage";
import { ensureResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ResumeStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await ensureResumeDocument(id, "主简历");

  return <StudioPage initialDocument={document} />;
}
