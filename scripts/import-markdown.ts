import { promises as fs } from "node:fs";
import { parseResumeFromMarkdown, summarizeMarkdownDocument } from "../src/lib/resume-markdown";
import { ensureResumeDocument, writeResumeDocument } from "../src/lib/storage";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const filePath = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!filePath) {
    throw new Error("Usage: npm run import:markdown -- <file.md> [--resume default]");
  }

  const resumeId = getArgValue("--resume") ?? "default";
  const existing = await ensureResumeDocument(resumeId, "Primary Resume");
  const markdown = await fs.readFile(filePath, "utf8");
  const document = parseResumeFromMarkdown(markdown, {
    existingDocument: existing,
    resumeId,
  });
  const saved = await writeResumeDocument(document);
  process.stdout.write(`${JSON.stringify(summarizeMarkdownDocument(saved), null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
