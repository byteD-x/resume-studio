import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import { buildResumePreviewHtml } from "@/lib/resume-preview";

describe("resume preview sanitization", () => {
  it("keeps safe profile links and strips unsafe ones", () => {
    const document = createEmptyResumeDocument("preview", "Preview");
    document.meta.template = "aurora-grid";
    document.basics.name = "Preview Candidate";
    document.basics.summaryHtml = "<p>Summary</p>";
    document.basics.links = [
      { label: "Portfolio", url: "example.com/work" },
      { label: "Unsafe", url: "javascript:alert(1)" },
    ];

    const html = buildResumePreviewHtml(document);

    expect(html).toContain('href="https://example.com/work"');
    expect(html).not.toContain("javascript:alert");
  });

  it("drops unsafe photo sources from the preview", () => {
    const document = createEmptyResumeDocument("preview-photo", "Preview Photo");
    document.basics.name = "Preview Candidate";
    document.basics.summaryHtml = "<p>Summary</p>";
    document.basics.photoVisible = true;
    document.basics.photoUrl = "javascript:alert(1)";

    const html = buildResumePreviewHtml(document);

    expect(html).not.toContain('class="resume-photo"');
    expect(html).not.toContain("javascript:alert");
  });
});
