import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createEmptyResumeDocument,
  createGuidedResumeDocument,
  createTemplateStarterDocument,
  type ResumeStarterPreset,
  validateResumeDocument,
  withUpdatedTimestamp,
} from "@/lib/resume-document";
import { resolveLegacyResumeStorageRoot, resolveUserResumeStorageRoot } from "@/lib/data-root";
import { nowIso, slugify } from "@/lib/utils";
import type { ResumeDocument, ResumeWriterProfile } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";

async function ensureDir(value: string) {
  await fs.mkdir(value, { recursive: true });
}

async function pathExists(value: string) {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

function getUserStorageRoot(userId: string) {
  return resolveUserResumeStorageRoot(userId);
}

function getResumeDir(userId: string, id: string) {
  return path.join(getUserStorageRoot(userId), slugify(id));
}

function legacySlugify(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "resume";
}

function getLegacyResumeDir(userId: string, id: string) {
  return path.join(getUserStorageRoot(userId), legacySlugify(id));
}

function getDocumentPath(userId: string, id: string) {
  return path.join(getResumeDir(userId, id), "document.json");
}

async function resolveResumeDir(userId: string, id: string) {
  const currentDir = getResumeDir(userId, id);
  if (await pathExists(currentDir)) {
    return currentDir;
  }

  const legacyDir = getLegacyResumeDir(userId, id);
  if (legacyDir !== currentDir && (await pathExists(legacyDir))) {
    return legacyDir;
  }

  return currentDir;
}

async function createUniqueResumeId(userId: string, base: string) {
  const normalizedBase = slugify(base) || `resume-${Date.now()}`;
  let candidate = normalizedBase;
  let suffix = 2;

  while (await pathExists(getResumeDir(userId, candidate))) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function ensureUserStorageRoot(userId: string) {
  await ensureDir(getUserStorageRoot(userId));
}

export async function readUserResumeDocument(userId: string, id: string) {
  const documentPath = path.join(await resolveResumeDir(userId, id), "document.json");
  const raw = await fs.readFile(documentPath, "utf8");
  return validateResumeDocument(JSON.parse(raw));
}

export async function writeUserResumeDocument(userId: string, document: ResumeDocument) {
  await ensureDir(getResumeDir(userId, document.meta.id));
  const normalized = withUpdatedTimestamp(validateResumeDocument(document));
  await fs.writeFile(getDocumentPath(userId, document.meta.id), `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

export async function ensureUserResumeDocument(userId: string, id: string, title?: string) {
  await ensureUserStorageRoot(userId);

  try {
    return await readUserResumeDocument(userId, id);
  } catch {
    const created = createEmptyResumeDocument(id, title ?? "未命名简历");
    return writeUserResumeDocument(userId, created);
  }
}

export async function listUserResumeDocuments(userId: string) {
  const dataRoot = getUserStorageRoot(userId);
  await ensureDir(dataRoot);
  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const documents = (
    await Promise.allSettled(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => readUserResumeDocument(userId, entry.name)),
    )
  ).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  return documents.sort((left, right) => right.meta.updatedAt.localeCompare(left.meta.updatedAt));
}

export async function createUserResumeDocument(
  userId: string,
  title: string,
  options: {
    starter?: ResumeStarterPreset;
    writerProfile?: ResumeWriterProfile;
    template?: ResumeDocument["meta"]["template"];
  } = {},
) {
  const id = await createUniqueResumeId(userId, title);
  const document =
    options.starter === "template-sample"
      ? createTemplateStarterDocument(id, title, options.writerProfile, options.template)
      : options.starter === "guided"
        ? createGuidedResumeDocument(id, title, options.writerProfile, options.template)
        : createEmptyResumeDocument(id, title, {
            writerProfile: options.writerProfile,
            template: options.template,
          });
  return writeUserResumeDocument(userId, document);
}

export async function listUserResumeSummaries(userId: string) {
  const documents = await listUserResumeDocuments(userId);
  const summaries = documents.map((document) => ({
    meta: document.meta,
    basics: document.basics,
    targeting: document.targeting,
    ai: document.ai,
    layout: document.layout,
    sections: document.sections,
    importTrace: document.importTrace,
  }));

  return summaries satisfies ResumeDashboardSummary[];
}

export async function writeUserImportArtifact(
  userId: string,
  id: string,
  name: string,
  payload: unknown,
) {
  const importDir = path.join(await resolveResumeDir(userId, id), "imports");
  await ensureDir(importDir);
  const filePath = path.join(importDir, name);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return filePath;
}

export async function writeUserExportedPdf(userId: string, id: string, buffer: Buffer) {
  const exportDir = path.join(await resolveResumeDir(userId, id), "exports");
  await ensureDir(exportDir);
  const fileName = `${nowIso().replace(/[:.]/g, "-")}.pdf`;
  await fs.writeFile(path.join(exportDir, fileName), buffer);
  return fileName;
}

export async function duplicateUserResumeDocument(userId: string, sourceId: string, nextTitle?: string) {
  const source = await readUserResumeDocument(userId, sourceId);
  const title = nextTitle?.trim() || `${source.meta.title} 副本`;
  const id = await createUniqueResumeId(userId, title);

  return writeUserResumeDocument(userId, {
    ...source,
    meta: {
      ...source.meta,
      id,
      title,
    },
  });
}

export async function deleteUserResumeDocument(userId: string, id: string) {
  await fs.rm(await resolveResumeDir(userId, id), { recursive: true, force: true });
}

export async function deleteUserResumeDocuments(userId: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  await Promise.all(uniqueIds.map(async (id) => deleteUserResumeDocument(userId, id)));
}

export async function hasLegacyResumeData() {
  const legacyRoot = resolveLegacyResumeStorageRoot();

  try {
    const entries = await fs.readdir(legacyRoot, { withFileTypes: true });
    return entries.some((entry) => entry.isDirectory());
  } catch {
    return false;
  }
}

export async function migrateLegacyResumesToUser(userId: string) {
  const legacyRoot = resolveLegacyResumeStorageRoot();
  const targetRoot = getUserStorageRoot(userId);
  await ensureDir(targetRoot);

  let entries: Array<import("node:fs").Dirent>;
  try {
    entries = await fs.readdir(legacyRoot, { withFileTypes: true });
  } catch {
    return 0;
  }

  let movedCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const sourceDir = path.join(legacyRoot, entry.name);
    let targetDir = path.join(targetRoot, entry.name);

    if (await pathExists(targetDir)) {
      let suffix = 2;
      while (await pathExists(targetDir)) {
        targetDir = path.join(targetRoot, `${entry.name}-${suffix}`);
        suffix += 1;
      }
    }

    await fs.rename(sourceDir, targetDir);
    movedCount += 1;
  }

  return movedCount;
}
