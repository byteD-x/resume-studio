import { chromium } from "playwright";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import type { ResumeDocument } from "@/types/resume";

export async function exportResumePdf(document: ResumeDocument) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(buildResumePreviewHtml(document), {
      waitUntil: "domcontentloaded",
    });

    return Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
      }),
    );
  } finally {
    await browser.close();
  }
}
