import { describe, expect, it } from "vitest";
import { createEmptyResumeDocument } from "@/lib/resume-document";
import {
  parseResumeFromMarkdown,
  serializeResumeToMarkdown,
} from "@/lib/resume-markdown";

describe("resume markdown", () => {
  it("serializes a structured document into markdown", () => {
    const document = createEmptyResumeDocument("default", "主简历");
    document.basics.name = "Jane Doe";
    document.basics.headline = "Platform Engineer";
    document.sections[0].items.push({
      id: "item-1",
      title: "Example Corp",
      subtitle: "Senior Engineer",
      location: "Remote",
      dateRange: "2024 - 2026",
      meta: "TypeScript | Next.js",
      summaryHtml: "<p>Built delivery tooling.</p>",
      bulletPoints: ["Cut deploy time by 40%"],
      tags: ["TypeScript", "Next.js"],
    });

    const markdown = serializeResumeToMarkdown(document);

    expect(markdown).toContain("# Jane Doe");
    expect(markdown).toContain("> Platform Engineer");
    expect(markdown).toContain("## 工作经历 [experience]");
    expect(markdown).toContain("### Example Corp");
  });

  it("does not duplicate summary sections during markdown export", () => {
    const document = createEmptyResumeDocument("default", "主简历");
    document.basics.summaryHtml = "<p>Primary summary</p>";
    document.sections.unshift({
      id: "summary-section",
      type: "summary",
      title: "Summary",
      visible: true,
      layout: "rich-text",
      contentHtml: "<p>Imported summary section</p>",
      items: [],
    });

    const markdown = serializeResumeToMarkdown(document);
    const summaryHeadings = markdown.match(/^## Summary \[summary\]$/gm) ?? [];

    expect(summaryHeadings).toHaveLength(1);
    expect(markdown).toContain("Primary summary");
    expect(markdown).not.toContain("Imported summary section");
  });

  it("parses markdown back into a structured document", () => {
    const document = parseResumeFromMarkdown(`# Jane Doe
> Platform Engineer
- Email: jane@example.com
- Link: GitHub | https://github.com/example

## Summary [summary]
Builds resilient systems.

## Experience [experience]
### Example Corp
- Subtitle: Senior Engineer
- Date: 2024 - 2026
- Location: Remote
- Meta: TypeScript | Next.js
- Tags: TypeScript, Next.js

Built delivery tooling.

- Cut deploy time by 40%
`);

    expect(document.basics.name).toBe("Jane Doe");
    expect(document.basics.email).toBe("jane@example.com");
    expect(document.basics.links[0]?.label).toBe("GitHub");
    expect(document.sections[0]?.items[0]?.title).toBe("Example Corp");
    expect(document.sections[0]?.items[0]?.bulletPoints[0]).toBe("Cut deploy time by 40%");
    expect(document.importTrace.pendingReview).toEqual([]);
  });

  it("does not append markdown import review tasks onto an existing document", () => {
    const existingDocument = createEmptyResumeDocument("default", "Primary Resume");
    existingDocument.importTrace.portfolioImportedAt = new Date().toISOString();
    existingDocument.importTrace.pendingReview = ["Existing import review item"];

    const document = parseResumeFromMarkdown(`# Jane Doe
> Platform Engineer

## Summary [summary]
Builds resilient systems.
`, {
      existingDocument,
      resumeId: existingDocument.meta.id,
    });

    expect(document.importTrace.pendingReview).toEqual(["Existing import review item"]);
  });
});
