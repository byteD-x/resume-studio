import { describe, expect, it } from "vitest";
import { htmlToMarkdown, markdownToHtml, normalizeMarkdown } from "@/lib/markdown";

describe("markdown conversion", () => {
  it("converts markdown into HTML with headings and lists", () => {
    const html = markdownToHtml("# Title\n\n- one\n- two\n\n[Link](https://example.com)");

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<li>one</li>");
    expect(html).toContain('href="https://example.com"');
  });

  it("converts html back into markdown", () => {
    const markdown = htmlToMarkdown(
      "<h2>Section</h2><p>Hello <strong>world</strong></p><ul><li>Item</li></ul>",
    );

    expect(normalizeMarkdown(markdown)).toContain("## Section");
    expect(markdown).toContain("**world**");
    expect(markdown).toContain("-   Item");
  });
});
