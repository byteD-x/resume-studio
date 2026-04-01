import { assertSafeUrlImportTarget } from "@/lib/network-safety";
import { FETCH_TIMEOUT_MS, MAX_HTML_BYTES, crawlKeywords } from "./constants";
import { decodeHtmlEntities, htmlToReadableText, normalizeWhitespace, stripTags } from "./text";
import type { UrlImportOptions, UrlImportSummary } from "./types";

interface ParsedAnchor {
  href: string;
  text: string;
}

export interface ParsedHtmlPage {
  url: string;
  title: string;
  text: string;
  anchors: ParsedAnchor[];
}

export interface CrawlPortfolioSiteResult {
  aggregatedText: string;
  summary: UrlImportSummary;
  pages: ParsedHtmlPage[];
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? normalizeWhitespace(decodeHtmlEntities(stripTags(match[1] ?? ""))) : "";
}

function extractAnchors(html: string) {
  const anchors: ParsedAnchor[] = [];
  const anchorPattern = /<a\b[^>]*href=(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const href = normalizeWhitespace(match[1] ?? match[2] ?? "");
    const text = normalizeWhitespace(decodeHtmlEntities(stripTags(match[3] ?? "")));
    if (!href) continue;
    anchors.push({ href, text });
  }

  return anchors;
}

async function fetchHtmlPage(url: string): Promise<ParsedHtmlPage> {
  const safeUrl = assertSafeUrlImportTarget(url).toString();
  const response = await fetch(safeUrl, {
    headers: { "User-Agent": "Mozilla/5.0 Resume-Studio-Importer" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
    throw new Error("Only HTML pages can be imported from a URL.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (contentLength > MAX_HTML_BYTES) {
    throw new Error("The selected page is too large to import safely.");
  }

  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
    throw new Error("The selected page is too large to import safely.");
  }
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const targetHtml = bodyMatch ? bodyMatch[1] : html;

  return {
    url: safeUrl,
    title: extractTitle(html),
    text: htmlToReadableText(targetHtml),
    anchors: extractAnchors(targetHtml),
  };
}

function shouldSkipUrl(url: URL) {
  if (url.hash) url.hash = "";

  const pathname = url.pathname.toLowerCase();
  if (
    pathname.endsWith(".pdf")
    || pathname.endsWith(".png")
    || pathname.endsWith(".jpg")
    || pathname.endsWith(".jpeg")
    || pathname.endsWith(".gif")
    || pathname.endsWith(".svg")
    || pathname.endsWith(".zip")
  ) {
    return true;
  }

  return false;
}

function scoreCandidate(url: URL, anchorText: string) {
  const source = `${url.pathname} ${anchorText}`.toLowerCase();
  let score = 0;

  for (const keyword of crawlKeywords) {
    if (source.includes(keyword)) score += 4;
  }

  if (url.pathname.split("/").filter(Boolean).length <= 2) score += 1;
  if (anchorText.length > 0 && anchorText.length <= 40) score += 1;
  if (/blog|article|post|news/.test(source)) score -= 3;
  if (/contact|login|signin|signup|privacy|terms/.test(source)) score -= 5;

  return score;
}

function rankCandidateLinks(baseUrl: string, anchors: ParsedAnchor[]) {
  const base = new URL(baseUrl);
  const deduped = new Map<string, { url: string; score: number }>();

  for (const anchor of anchors) {
    try {
      const candidate = new URL(anchor.href, base);
      if (candidate.origin !== base.origin || shouldSkipUrl(candidate)) continue;

      const normalized = `${candidate.origin}${candidate.pathname}${candidate.search}`;
      const score = scoreCandidate(candidate, anchor.text);
      if (score <= 0 || normalized === baseUrl) continue;

      const current = deduped.get(normalized);
      if (!current || current.score < score) {
        deduped.set(normalized, { url: normalized, score });
      }
    } catch {
      continue;
    }
  }

  return [...deduped.values()]
    .sort((left, right) => right.score - left.score || left.url.localeCompare(right.url))
    .map((item) => item.url);
}

export async function crawlPortfolioSite(url: string, options: UrlImportOptions = {}): Promise<CrawlPortfolioSiteResult> {
  const normalizedUrl = assertSafeUrlImportTarget(url).toString();
  const includeLinkedPages = options.includeLinkedPages ?? true;
  const maxPages = Math.min(Math.max(options.maxPages ?? 3, 1), 6);
  const rootPage = await fetchHtmlPage(normalizedUrl);
  const discoveredCandidates = includeLinkedPages ? rankCandidateLinks(normalizedUrl, rootPage.anchors) : [];
  const selectedCandidates = discoveredCandidates.slice(0, Math.max(maxPages - 1, 0));
  const pages: ParsedHtmlPage[] = [rootPage];
  const skippedUrls = discoveredCandidates.slice(selectedCandidates.length);

  for (const candidateUrl of selectedCandidates) {
    try {
      pages.push(await fetchHtmlPage(candidateUrl));
    } catch {
      skippedUrls.push(candidateUrl);
    }
  }

  const aggregatedText = pages
    .map((page, index) => {
      const label = index === 0 ? "Root Page" : `Linked Page ${index}`;
      const heading = page.title ? `${label}: ${page.title}` : `${label}: ${page.url}`;
      return `${heading}\n${page.text}`;
    })
    .join("\n\n");

  return {
    aggregatedText,
    summary: {
      baseUrl: normalizedUrl,
      mode: pages.length > 1 ? "multi-page" : "single-page",
      pageCount: pages.length,
      selectedCandidateCount: selectedCandidates.length,
      discoveredCandidateCount: discoveredCandidates.length,
      visitedUrls: pages.map((page) => page.url),
      skippedUrls,
    } satisfies UrlImportSummary,
    pages,
  };
}
