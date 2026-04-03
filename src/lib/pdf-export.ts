import { chromium } from "playwright";
import { buildResumePreviewHtml } from "@/lib/resume-preview";
import type { ResumeDocument } from "@/types/resume";

const A4_PAGE_HEIGHT_PX = 1123;
const SINGLE_PAGE_OVERFLOW_RATIO = 1.08;

export async function exportResumePdf(document: ResumeDocument) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: {
        width: 1400,
        height: 1800,
      },
      deviceScaleFactor: 2,
    });
    await page.emulateMedia({ media: "screen" });
    await page.setContent(buildResumePreviewHtml(document), {
      waitUntil: "domcontentloaded",
    });
    await page.locator(".page").waitFor({ state: "visible" });

    const pageBounds = await page.locator(".page").boundingBox();
    const renderedHeight = pageBounds?.height ?? A4_PAGE_HEIGHT_PX;
    const png = await page.locator(".page").screenshot({ type: "png" });
    const imageSrc = `data:image/png;base64,${png.toString("base64")}`;
    const shouldFlattenToSinglePage = renderedHeight <= A4_PAGE_HEIGHT_PX * SINGLE_PAGE_OVERFLOW_RATIO;
    if (shouldFlattenToSinglePage) {
      await page.setContent(
        `<style>
          html, body { margin: 0; padding: 0; background: #fff; }
          img { display: block; width: 210mm; height: 297mm; object-fit: contain; }
          @page {
            size: A4;
            margin: 0;
          }
        </style>
        <img alt="Resume preview page 1" src="${imageSrc}" />`,
        {
          waitUntil: "domcontentloaded",
        },
      );
    } else {
      const pageCount = Math.max(1, Math.ceil(renderedHeight / A4_PAGE_HEIGHT_PX));
      const sheets = Array.from({ length: pageCount }, (_, index) => {
        const offsetMm = index * 297;
        return `<section class="sheet"><img alt="Resume preview page ${index + 1}" src="${imageSrc}" style="transform: translateY(-${offsetMm}mm)" /></section>`;
      }).join("");

      await page.setContent(
        `<style>
        html, body { margin: 0; padding: 0; background: #fff; }
        body { width: 210mm; }
        .sheet {
          position: relative;
          width: 210mm;
          height: 297mm;
          overflow: hidden;
          page-break-after: always;
          break-after: page;
        }
        .sheet:last-child {
          page-break-after: auto;
          break-after: auto;
        }
        .sheet img {
          position: absolute;
          top: 0;
          left: 0;
          display: block;
          width: 210mm;
          height: auto;
        }
        @page {
          size: A4;
          margin: 0;
        }
      </style>
      ${sheets}`,
        {
          waitUntil: "domcontentloaded",
        },
      );
    }

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
