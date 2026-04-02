import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AnimatedCharactersLoginPage } from "@/components/ui/animated-characters-login-page";
import { getAuthBootstrap, getOptionalAuthContext, sanitizeNextPath } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "登录",
  description: "登录后进入 Resume Studio 工作台。",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const auth = await getOptionalAuthContext();

  if (auth) {
    redirect("/");
  }

  const params = await searchParams;
  const bootstrap = await getAuthBootstrap();

  return (
    <AnimatedCharactersLoginPage
      hasLegacyResumes={bootstrap.hasLegacyResumes}
      hasUsers={bootstrap.hasUsers}
      nextPath={sanitizeNextPath(params.next)}
    />
  );
}
