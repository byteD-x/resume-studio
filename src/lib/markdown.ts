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

turndown.keep(["u"]);

export function markdownToHtml(markdown: string) {
  return sanitizeRichTextHtml(marked.parse(markdown) as string);
}

export function htmlToMarkdown(html: string) {
  return turndown.turndown(html || "");
}

export function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, "\n").trim();
}
