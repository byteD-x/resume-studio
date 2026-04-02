import { ResumeLibraryPage } from "@/components/product/ResumeLibraryPage";
import { requireAuthContext } from "@/lib/auth/dal";
import { listUserResumeSummaries } from "@/lib/user-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ResumesPage() {
  const auth = await requireAuthContext("/resumes");
  const resumes = await listUserResumeSummaries(auth.user.id);

  return <ResumeLibraryPage resumes={resumes} />;
}
