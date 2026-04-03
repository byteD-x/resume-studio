import { marked } from "marked";
import TurndownService from "turndown";
import { sanitizeRichTextHtml } from "@/lib/utils";

marked.setOptions({
  gfm: true,
  breaks: true,
});

const turndown = new TurndownService({
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
  headingStyle: "atx",
  strongDelimiter: "**",
});

turndown.keep(["span", "u"]);

function shouldPreserveHtmlInMarkdown(html: string) {
  return /<span\b| style=|<u\b/i.test(html);
}

export function markdownToHtml(markdown: string) {
  const result = marked.parse(markdown, { async: false }) as string;
  return sanitizeRichTextHtml(result);
}

export function htmlToMarkdown(html: string) {
  const sanitized = sanitizeRichTextHtml(html || "");

  if (!sanitized) return "";
  if (shouldPreserveHtmlInMarkdown(sanitized)) {
    return sanitized;
  }

  return turndown.turndown(sanitized);
}

export function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, "\n").trim();
}
