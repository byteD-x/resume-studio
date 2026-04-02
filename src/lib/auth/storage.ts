import "server-only";

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  authSessionRecordSchema,
  authUserPublicSchema,
  authUserRecordSchema,
  type AuthSessionRecord,
  type AuthUserPublic,
  type AuthUserRecord,
} from "@/lib/auth/types";
import { resolveAuthStorageRoot } from "@/lib/data-root";
import { nowIso, slugify } from "@/lib/utils";

const scrypt = promisify(scryptCallback);

function getUsersRoot() {
  return path.join(resolveAuthStorageRoot(), "users");
}

function getSessionsRoot() {
  return path.join(resolveAuthStorageRoot(), "sessions");
}

function getUserPath(userId: string) {
  return path.join(getUsersRoot(), `${userId}.json`);
}

function getSessionPath(sessionId: string) {
  return path.join(getSessionsRoot(), `${sessionId}.json`);
}

async function ensureDir(directory: string) {
  await fs.mkdir(directory, { recursive: true });
}

async function pathExists(value: string) {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(filePath: string, payload: unknown) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readJson<T>(filePath: string, parse: (value: unknown) => T) {
  const raw = await fs.readFile(filePath, "utf8");
  return parse(JSON.parse(raw));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function createUniqueUserId(base: string) {
  const normalizedBase = slugify(base) || "user";
  let candidate = normalizedBase;
  let suffix = 2;

  while (await pathExists(getUserPath(candidate))) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function hashPassword(password: string, salt?: string) {
  const nextSalt = salt ?? randomBytes(16).toString("hex");
  const derived = (await scrypt(password, nextSalt, 64)) as Buffer;

  return {
    hash: derived.toString("hex"),
    salt: nextSalt,
  };
}

export function toPublicAuthUser(user: AuthUserRecord) {
  return authUserPublicSchema.parse({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }) satisfies AuthUserPublic;
}

export async function listAuthUsers() {
  await ensureDir(getUsersRoot());
  const entries = await fs.readdir(getUsersRoot(), { withFileTypes: true });
  const users = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => readJson(getUserPath(path.basename(entry.name, ".json")), authUserRecordSchema.parse)),
  );

  return users.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function hasAnyAuthUsers() {
  const users = await listAuthUsers();
  return users.length > 0;
}

export async function readAuthUser(userId: string) {
  return readJson(getUserPath(userId), authUserRecordSchema.parse);
}

export async function findAuthUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const users = await listAuthUsers();
  return users.find((user) => normalizeEmail(user.email) === normalizedEmail) ?? null;
}

export async function registerAuthUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const existing = await findAuthUserByEmail(email);

  if (existing) {
    throw new Error("该邮箱已经注册。");
  }

  const id = await createUniqueUserId(name || email.split("@")[0] || "user");
  const timestamp = nowIso();
  const password = await hashPassword(input.password);
  const record = authUserRecordSchema.parse({
    id,
    email,
    name,
    passwordHash: password.hash,
    passwordSalt: password.salt,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: "",
  });

  await writeJson(getUserPath(record.id), record);
  return record;
}

export async function verifyAuthUserPassword(user: AuthUserRecord, password: string) {
  const derived = await hashPassword(password, user.passwordSalt);
  const expected = Buffer.from(user.passwordHash, "hex");
  const actual = Buffer.from(derived.hash, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export async function touchAuthUserLastLogin(userId: string) {
  const current = await readAuthUser(userId);
  const timestamp = nowIso();
  const next = authUserRecordSchema.parse({
    ...current,
    updatedAt: timestamp,
    lastLoginAt: timestamp,
  });

  await writeJson(getUserPath(userId), next);
  return next;
}

export async function writeAuthSession(record: AuthSessionRecord) {
  const normalized = authSessionRecordSchema.parse(record);
  await writeJson(getSessionPath(normalized.id), normalized);
  return normalized;
}

export async function readAuthSession(sessionId: string) {
  return readJson(getSessionPath(sessionId), authSessionRecordSchema.parse);
}

export async function deleteAuthSession(sessionId: string) {
  await fs.rm(getSessionPath(sessionId), { force: true });
}

export function createAuthSessionId() {
  return `session_${randomBytes(24).toString("hex")}`;
}
