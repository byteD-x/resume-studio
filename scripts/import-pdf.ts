import { promises as fs } from "node:fs";
import { importPdfToResume } from "../src/lib/pdf-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "../src/lib/storage";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const filePath = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!filePath) {
    throw new Error("Usage: npm run import:pdf -- <file.pdf> [--resume default]");
  }

  const resumeId = getArgValue("--resume") ?? "default";
  const existing = await ensureResumeDocument(resumeId, "Primary Resume");
  const buffer = await fs.readFile(filePath);
  const result = await importPdfToResume(buffer, {
    existingDocument: existing,
    resumeId,
  });

  await writeImportArtifact(resumeId, "pdf.raw.json", result.rawPdf);
  const saved = await writeResumeDocument(result.document);
  process.stdout.write(`Imported PDF into ${saved.meta.id}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
