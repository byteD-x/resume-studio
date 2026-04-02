import "server-only";

import { cookies } from "next/headers";
import { createAuthSessionId, deleteAuthSession, readAuthSession, writeAuthSession } from "@/lib/auth/storage";
import type { AuthSessionRecord } from "@/lib/auth/types";
import { nowIso } from "@/lib/utils";

export const AUTH_SESSION_COOKIE = "resume_studio_session";

const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 12;
const REMEMBER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function isExpired(expiresAt: string) {
  return Date.parse(expiresAt) <= Date.now();
}

function buildSessionExpiry(remember: boolean) {
  const seconds = remember ? REMEMBER_SESSION_MAX_AGE : DEFAULT_SESSION_MAX_AGE;
  return {
    expiresAt: new Date(Date.now() + seconds * 1000).toISOString(),
    maxAge: seconds,
  };
}

async function setAuthSessionCookie(sessionId: string, maxAge: number) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function createAuthSession(userId: string, remember: boolean) {
  const { expiresAt, maxAge } = buildSessionExpiry(remember);
  const session = await writeAuthSession({
    id: createAuthSessionId(),
    userId,
    createdAt: nowIso(),
    expiresAt,
    remember,
  });

  await setAuthSessionCookie(session.id, maxAge);
  return session;
}

export async function getAuthSessionFromCookies() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!sessionId) {
    return null;
  }

  let session: AuthSessionRecord;
  try {
    session = await readAuthSession(sessionId);
  } catch {
    return null;
  }

  if (isExpired(session.expiresAt)) {
    await deleteAuthSession(session.id);
    return null;
  }

  return session;
}

export async function clearCurrentAuthSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (sessionId) {
    await deleteAuthSession(sessionId);
  }

  cookieStore.delete(AUTH_SESSION_COOKIE);
}
