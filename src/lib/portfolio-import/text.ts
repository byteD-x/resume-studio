export function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
}

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

export function stripTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

export function htmlToReadableText(html: string) {
  return normalizeWhitespace(
    decodeHtmlEntities(
      html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<(br|\/p|\/div|\/section|\/article|\/li|\/h[1-6])>/gi, "\n")
        .replace(/<(p|div|section|article|li|h[1-6])[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/\n{2,}/g, "\n"),
    ),
  )
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .join("\n");
}
