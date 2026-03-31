import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { templateCatalog } from "@/data/template-catalog";
import { createTemplateStarterDocument } from "@/lib/resume-document";
import { buildResumePreviewHtml } from "@/lib/resume-preview";

const OUTPUT_DIR = path.join(process.cwd(), "public", "template-previews");

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1100, height: 1500 },
      deviceScaleFactor: 2,
    });

    await page.emulateMedia({ media: "screen" });

    for (const template of templateCatalog) {
      const writerProfile = template.recommendedProfiles[0] ?? "experienced";
      const document = createTemplateStarterDocument(
        `preview-${template.id}`,
        template.name,
        writerProfile,
        template.id,
      );

      await page.setContent(buildResumePreviewHtml(document), {
        waitUntil: "domcontentloaded",
      });

      await page.locator(".page").first().screenshot({
        path: path.join(OUTPUT_DIR, `${template.id}.png`),
        type: "png",
      });

      console.log(`generated ${template.id}.png`);
    }
  } finally {
    await browser.close();
  }
}

void main();
