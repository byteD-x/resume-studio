import { DashboardPage } from "@/components/studio/DashboardPage";
import { listResumeSummaries } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  const resumes = await listResumeSummaries();

  return <DashboardPage resumes={resumes} />;
}
