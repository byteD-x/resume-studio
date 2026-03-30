import { ResumeLibraryPage } from "@/components/product/ResumeLibraryPage";
import { listResumeSummaries } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const resumes = await listResumeSummaries();

  return <ResumeLibraryPage resumes={resumes} />;
}
