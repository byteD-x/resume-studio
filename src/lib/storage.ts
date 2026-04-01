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
import type { ResumeDocument } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";
import type { ResumeWriterProfile } from "@/types/resume";
import { nowIso, slugify } from "@/lib/utils";

function resolveStorageRoot() {
  const configuredRoot = process.env.RESUME_STUDIO_DATA_DIR?.trim();
  if (configuredRoot) {
    return path.isAbsolute(configuredRoot)
      ? configuredRoot
      : path.join(/*turbopackIgnore: true*/ process.cwd(), configuredRoot);
  }

  return path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "resumes");
}

export function getStorageRoot() {
  return resolveStorageRoot();
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

function getResumeDir(id: string) {
  return path.join(getStorageRoot(), slugify(id));
}

function getLegacyResumeDir(id: string) {
  return path.join(getStorageRoot(), legacySlugify(id));
}

function getDocumentPath(id: string) {
  return path.join(getResumeDir(id), "document.json");
}

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

async function resolveResumeDir(id: string) {
  const currentDir = getResumeDir(id);
  if (await pathExists(currentDir)) {
    return currentDir;
  }

  const legacyDir = getLegacyResumeDir(id);
  if (legacyDir !== currentDir && await pathExists(legacyDir)) {
    return legacyDir;
  }

  return currentDir;
}

async function createUniqueResumeId(base: string) {
  const normalizedBase = slugify(base) || `resume-${Date.now()}`;
  let candidate = normalizedBase;
  let suffix = 2;

  while (await pathExists(getResumeDir(candidate))) {
    candidate = `${normalizedBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function ensureStorageRoot() {
  await ensureDir(getStorageRoot());
}

export async function readResumeDocument(id: string) {
  const documentPath = path.join(await resolveResumeDir(id), "document.json");
  const raw = await fs.readFile(documentPath, "utf8");
  return validateResumeDocument(JSON.parse(raw));
}

export async function writeResumeDocument(document: ResumeDocument) {
  await ensureDir(getResumeDir(document.meta.id));
  const normalized = withUpdatedTimestamp(validateResumeDocument(document));
  await fs.writeFile(getDocumentPath(document.meta.id), `${JSON.stringify(normalized, null, 2)}\n`);
  return normalized;
}

export async function ensureResumeDocument(id: string, title?: string) {
  await ensureStorageRoot();

  try {
    return await readResumeDocument(id);
  } catch {
    const created = createEmptyResumeDocument(id, title ?? "未命名简历");
    return writeResumeDocument(created);
  }
}

export async function listResumeDocuments() {
  const dataRoot = getStorageRoot();
  await ensureDir(dataRoot);
  const entries = await fs.readdir(dataRoot, { withFileTypes: true });
  const documents = (
    await Promise.allSettled(
      entries
        .filter((entry) => entry.isDirectory())
        .map(async (entry) => readResumeDocument(entry.name)),
    )
  )
    .flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  return documents.sort((left, right) =>
    right.meta.updatedAt.localeCompare(left.meta.updatedAt),
  );
}

export async function createResumeDocument(
  title: string,
  options: {
    starter?: ResumeStarterPreset;
    writerProfile?: ResumeWriterProfile;
    template?: ResumeDocument["meta"]["template"];
  } = {},
) {
  const id = await createUniqueResumeId(title);
  const document =
    options.starter === "template-sample"
      ? createTemplateStarterDocument(id, title, options.writerProfile, options.template)
      : options.starter === "guided"
      ? createGuidedResumeDocument(id, title, options.writerProfile, options.template)
      : createEmptyResumeDocument(id, title, {
          writerProfile: options.writerProfile,
          template: options.template,
        });
  return writeResumeDocument(document);
}

export async function listResumeSummaries() {
  const documents = await listResumeDocuments();
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

export async function writeImportArtifact(
  id: string,
  name: string,
  payload: unknown,
) {
  const importDir = path.join(await resolveResumeDir(id), "imports");
  await ensureDir(importDir);
  const filePath = path.join(importDir, name);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return filePath;
}

export async function writeExportedPdf(id: string, buffer: Buffer) {
  const exportDir = path.join(await resolveResumeDir(id), "exports");
  await ensureDir(exportDir);
  const fileName = `${nowIso().replace(/[:.]/g, "-")}.pdf`;
  await fs.writeFile(path.join(exportDir, fileName), buffer);
  return fileName;
}

export async function duplicateResumeDocument(sourceId: string, nextTitle?: string) {
  const source = await readResumeDocument(sourceId);
  const title = nextTitle?.trim() || `${source.meta.title} 副本`;
  const id = await createUniqueResumeId(title);

  return writeResumeDocument({
    ...source,
    meta: {
      ...source.meta,
      id,
      title,
    },
  });
}

export async function deleteResumeDocument(id: string) {
  await fs.rm(await resolveResumeDir(id), { recursive: true, force: true });
}

export async function deleteResumeDocuments(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  await Promise.all(uniqueIds.map((id) => deleteResumeDocument(id)));
}
