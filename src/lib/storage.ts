import { promises as fs } from "node:fs";
import path from "node:path";
import {
  createEmptyResumeDocument,
  createGuidedResumeDocument,
  type ResumeStarterPreset,
  validateResumeDocument,
  withUpdatedTimestamp,
} from "@/lib/resume-document";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeDashboardSummary } from "@/types/resume-manager";
import type { ResumeWriterProfile } from "@/types/resume";
import { nowIso, slugify } from "@/lib/utils";

const DATA_ROOT = path.join(process.cwd(), "data", "resumes");

function getResumeDir(id: string) {
  return path.join(DATA_ROOT, slugify(id));
}

function getDocumentPath(id: string) {
  return path.join(getResumeDir(id), "document.json");
}

function getExportDir(id: string) {
  return path.join(getResumeDir(id), "exports");
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
  await ensureDir(DATA_ROOT);
}

export async function readResumeDocument(id: string) {
  const documentPath = getDocumentPath(id);
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
  await ensureStorageRoot();
  const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
  const documents: ResumeDocument[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      documents.push(await readResumeDocument(entry.name));
    } catch {
      continue;
    }
  }

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
    options.starter === "guided"
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
  const importDir = path.join(getResumeDir(id), "imports");
  await ensureDir(importDir);
  const filePath = path.join(importDir, name);
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  return filePath;
}

export async function writeExportedPdf(id: string, buffer: Buffer) {
  const exportDir = getExportDir(id);
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
  await fs.rm(getResumeDir(id), { recursive: true, force: true });
}
