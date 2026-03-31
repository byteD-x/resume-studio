import { readResumeDocument } from "../src/lib/storage";
import { buildResumeQualityReport } from "../src/lib/resume-analysis";
import { stripHtml } from "../src/lib/utils";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const resumeId = getArgValue("--resume") ?? "default";
  const document = await readResumeDocument(resumeId);
  const summary = stripHtml(document.basics.summaryHtml).slice(0, 140);
  const quality = buildResumeQualityReport(document);
  process.stdout.write(
    JSON.stringify(
      {
        id: document.meta.id,
        title: document.meta.title,
        sections: document.sections.length,
        summary,
        blockingIssues: quality.blockingIssues,
        warnings: quality.warnings,
      },
      null,
      2,
    ),
  );
  process.stdout.write("\n");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
