import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { expect, test as base } from "@playwright/test";
import type { APIRequestContext, Cookie } from "@playwright/test";
import { resolveAuthStorageRoot, resolveUserWorkspaceRoot } from "../../../src/lib/data-root";

const E2E_DATA_DIR = ".tmp/playwright-resumes";
const AUTH_SESSION_COOKIE = "resume_studio_session";
const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

function slugify(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "user";
}

async function createAuthCookie(testId: string, baseURL: string): Promise<{
  cookie: Cookie;
  sessionId: string;
  userId: string;
}> {
  process.env.RESUME_STUDIO_DATA_DIR = E2E_DATA_DIR;
  const host = new URL(baseURL).hostname;
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const timestamp = new Date().toISOString();
  const email = `${testId}@example.com`;
  const userId = slugify(`playwright-${testId}`);
  const sessionId = `session_${randomBytes(24).toString("hex")}`;

  await fs.mkdir(path.join(resolveAuthStorageRoot(), "users"), { recursive: true });
  await fs.mkdir(path.join(resolveAuthStorageRoot(), "sessions"), { recursive: true });
  await fs.writeFile(
    path.join(resolveAuthStorageRoot(), "users", `${userId}.json`),
    `${JSON.stringify(
      {
        id: userId,
        email,
        name: `Playwright ${testId}`,
        passwordHash: "e2e-password-hash",
        passwordSalt: "e2e-password-salt",
        createdAt: timestamp,
        updatedAt: timestamp,
        lastLoginAt: timestamp,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(resolveAuthStorageRoot(), "sessions", `${sessionId}.json`),
    `${JSON.stringify(
      {
        id: sessionId,
        userId,
        createdAt: timestamp,
        expiresAt: new Date(expiresAt).toISOString(),
        remember: false,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return {
    sessionId,
    userId,
    cookie: {
      name: AUTH_SESSION_COOKIE,
      value: sessionId,
      domain: host,
      path: "/",
      expires: Math.floor(expiresAt / 1000),
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  };
}

async function cleanupAuthArtifacts(userId: string, sessionId: string) {
  await Promise.allSettled([
    fs.rm(path.join(resolveAuthStorageRoot(), "sessions", `${sessionId}.json`), { force: true }),
    fs.rm(resolveUserWorkspaceRoot(userId), { recursive: true, force: true }),
    fs.rm(path.join(resolveAuthStorageRoot(), "users", `${userId}.json`), { force: true }),
  ]);
}

export const test = base.extend<{
  authSession: Awaited<ReturnType<typeof createAuthCookie>>;
  request: APIRequestContext;
}>({
  authSession: async ({ baseURL }, finishAuthSession, testInfo) => {
    const scopedBaseUrl = baseURL ?? DEFAULT_BASE_URL;
    const testId = `${testInfo.workerIndex}-${testInfo.parallelIndex}-${Date.now()}`;
    const session = await createAuthCookie(testId, scopedBaseUrl);

    try {
      await finishAuthSession(session);
    } finally {
      await cleanupAuthArtifacts(session.userId, session.sessionId);
    }
  },
  page: async ({ page, authSession }, finishPage) => {
    await page.context().addCookies([authSession.cookie]);

    await finishPage(page);
  },
  request: async ({ playwright, baseURL, authSession }, finishRequest) => {
    const scopedBaseUrl = baseURL ?? DEFAULT_BASE_URL;
    const request = await playwright.request.newContext({
      baseURL: scopedBaseUrl,
      storageState: {
        cookies: [authSession.cookie],
        origins: [],
      },
    });

    try {
      await finishRequest(request);
    } finally {
      await request.dispose();
    }
  },
});

export { expect };
