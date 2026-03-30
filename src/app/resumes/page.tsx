import type { Metadata } from "next";
import { ResumeLibraryPage } from "@/components/product/ResumeLibraryPage";
import { listResumeSummaries } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "我的简历",
  description: "查看和管理本地保存的简历。",
};

export default async function ResumesPage() {
  const resumes = await listResumeSummaries();

  return <ResumeLibraryPage resumes={resumes} />;
}
