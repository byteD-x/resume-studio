import { importPortfolioToResume } from "../src/lib/portfolio-import";
import { ensureResumeDocument, writeImportArtifact, writeResumeDocument } from "../src/lib/storage";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const resumeId = getArgValue("--resume") ?? "default";
  const portfolioPath = getArgValue("--portfolio");
  const existing = await ensureResumeDocument(resumeId, "Primary Resume");
  const result = await importPortfolioToResume({
    existingDocument: existing,
    portfolioPath,
    resumeId,
  });

  await writeImportArtifact(resumeId, "portfolio.raw.json", result.rawPortfolio);
  const saved = await writeResumeDocument(result.document);
  process.stdout.write(`Imported portfolio into ${saved.meta.id}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
