import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumeEditorPage } from "@/components/product/ResumeEditorPage";
import { requireAuthContext } from "@/lib/auth/dal";
import { buildResumeLineageMap } from "@/lib/resume-lineage";
import { listUserResumeSummaries, readUserResumeDocument } from "@/lib/user-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "编辑",
  description: "编辑内容与实时预览。",
};

export default async function ResumeStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireAuthContext(`/studio/${id}`);
  let document;
  let lineage = null;

  try {
    const [loadedDocument, summaries] = await Promise.all([
      readUserResumeDocument(auth.user.id, id),
      listUserResumeSummaries(auth.user.id),
    ]);
    document = loadedDocument;
    lineage = buildResumeLineageMap(summaries).get(id) ?? null;
  } catch {
    notFound();
  }

  return <ResumeEditorPage initialDocument={document} lineage={lineage} />;
}
