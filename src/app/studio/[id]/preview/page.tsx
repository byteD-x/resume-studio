import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResumePreviewPage } from "@/components/product/ResumePreviewPage";
import { readResumeDocument } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "预览",
  description: "预览并导出 PDF。",
};

export default async function ResumePreviewRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let document;

  try {
    document = await readResumeDocument(id);
  } catch {
    notFound();
  }

  return <ResumePreviewPage initialDocument={document} />;
}
