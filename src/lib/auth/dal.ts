import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthSessionFromCookies } from "@/lib/auth/session";
import { readAuthUser, toPublicAuthUser } from "@/lib/auth/storage";
import { hasAnyAuthUsers } from "@/lib/auth/storage";
import { hasLegacyResumeData } from "@/lib/user-storage";

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value) {
    return "/";
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/login")) {
    return "/";
  }

  return trimmed;
}

export function buildLoginHref(nextPath?: string | null) {
  const safeNextPath = sanitizeNextPath(nextPath);
  if (!safeNextPath || safeNextPath === "/") {
    return "/login";
  }

  return `/login?next=${encodeURIComponent(safeNextPath)}`;
}

export const getOptionalAuthContext = cache(async () => {
  const session = await getAuthSessionFromCookies();

  if (!session) {
    return null;
  }

  try {
    const user = await readAuthUser(session.userId);
    return {
      session,
      user: toPublicAuthUser(user),
    };
  } catch {
    return null;
  }
});

export async function requireAuthContext(nextPath?: string) {
  const context = await getOptionalAuthContext();
  if (!context) {
    redirect(buildLoginHref(nextPath));
  }

  return context;
}

export async function requireApiAuthContext() {
  return getOptionalAuthContext();
}

export async function getAuthBootstrap() {
  const [hasUsers, hasLegacyResumes] = await Promise.all([
    hasAnyAuthUsers(),
    hasLegacyResumeData(),
  ]);

  return {
    hasUsers,
    hasLegacyResumes,
  };
}
