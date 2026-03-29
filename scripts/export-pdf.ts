import { promises as fs } from "node:fs";
import path from "node:path";
import { exportResumePdf } from "../src/lib/pdf-export";
import { readResumeDocument, writeExportedPdf } from "../src/lib/storage";
import { slugify } from "../src/lib/utils";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const resumeId = getArgValue("--resume") ?? "default";
  const outPath = getArgValue("--out");
  const document = await readResumeDocument(resumeId);
  const pdf = await exportResumePdf(document);
  await writeExportedPdf(resumeId, pdf);

  const targetPath =
    outPath ?? path.join(process.cwd(), `${slugify(document.meta.title)}.pdf`);

  await fs.writeFile(targetPath, pdf);
  process.stdout.write(`Exported PDF to ${targetPath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
