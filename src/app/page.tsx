import { HomeHubPage } from "@/components/product/HomeHubPage";
import { requireAuthContext } from "@/lib/auth/dal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAuthContext("/");
  return <HomeHubPage />;
}
