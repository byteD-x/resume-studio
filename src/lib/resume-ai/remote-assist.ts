import { stripHtml } from "@/lib/utils";
import type { ResumeAssistSuggestion } from "@/lib/resume-assistant";
import type { ResumeDocument, ResumeSectionItem, ResumeSectionType } from "@/types/resume";
import { cleanBulletLines, cleanSummaryText, cleanTagLines, extractJsonObject } from "@/lib/resume-ai/parsing";
import type { ResumeAiMessage } from "@/lib/resume-ai/types";
import { collectEvidenceLines, requestRemoteResumeAiText } from "@/lib/resume-ai/remote-client";

function buildRemoteSummaryAssistMessages(document: ResumeDocument): ResumeAiMessage[] {
  const evidenceLines = collectEvidenceLines(document);
  const currentSummary = stripHtml(document.basics.summaryHtml);

  return [
    {
      role: "system",
      content:
        "You are a resume writing assistant. Use only provided facts. Return JSON only. Write all user-facing text in Simplified Chinese.",
    },
    {
      role: "user",
      content: [
        "Return JSON with this shape:",
        '{"variants":[{"label":"string","detail":"string","text":"string"}]}',
        "Need 1 or 2 summary variants for a Chinese resume.",
        "Rules:",
        "1. Do not invent metrics or experience.",
        "2. Keep each variant to 2-3 sentences.",
        "3. Focus on the target role and JD when available.",
        "",
        `Target role: ${document.targeting.role || "N/A"}`,
        `Target company: ${document.targeting.company || "N/A"}`,
        `Keywords: ${document.targeting.focusKeywords.join(", ") || "N/A"}`,
        `JD: ${document.targeting.jobDescription.trim().slice(0, 1200) || "N/A"}`,
        `Headline: ${document.basics.headline || "N/A"}`,
        `Current summary: ${currentSummary || "N/A"}`,
        "Evidence:",
        ...(evidenceLines.length > 0 ? evidenceLines.map((line) => `- ${line}`) : ["- N/A"]),
      ].join("\n"),
    },
  ];
}

function buildRemoteItemAssistMessages(
  document: ResumeDocument,
  sectionType: ResumeSectionType,
  item: ResumeSectionItem,
): ResumeAiMessage[] {
  return [
    {
      role: "system",
      content:
        "You are a resume writing assistant. Use only provided facts. Return JSON only. Write all user-facing text in Simplified Chinese.",
    },
    {
      role: "user",
      content: [
        `Section type: ${sectionType}`,
        `Target role: ${document.targeting.role || "N/A"}`,
        `Keywords: ${document.targeting.focusKeywords.join(", ") || "N/A"}`,
        `JD: ${document.targeting.jobDescription.trim().slice(0, 1000) || "N/A"}`,
        `Item title: ${item.title || "N/A"}`,
        `Item subtitle: ${item.subtitle || "N/A"}`,
        `Item meta: ${item.meta || "N/A"}`,
        `Item summary: ${stripHtml(item.summaryHtml) || "N/A"}`,
        `Item bullets: ${item.bulletPoints.join(" | ") || "N/A"}`,
        `Item tags: ${item.tags.join(", ") || "N/A"}`,
        "",
        sectionType === "skills"
          ? [
              "Return JSON with this shape:",
              '{"detail":"string","tags":["string"]}',
              "Need a cleaned list of resume-ready skills. Keep only relevant skill keywords.",
            ].join("\n")
          : [
              "Return JSON with this shape:",
              '{"detail":"string","summary":"string","bullets":["string"]}',
              "Need resume-ready Chinese phrasing.",
              "Rules:",
              "1. Do not invent metrics.",
              "2. Summary is optional and should be 1-2 sentences.",
              "3. Bullets should be 2-4 lines, concise and resume-ready.",
            ].join("\n"),
      ].join("\n"),
    },
  ];
}

export async function generateRemoteSummarySuggestions(
  document: ResumeDocument,
  apiKeyOverride?: string,
): Promise<ResumeAssistSuggestion[]> {
  const text = await requestRemoteResumeAiText(document.ai, buildRemoteSummaryAssistMessages(document), 0.35, apiKeyOverride);
  const payload = extractJsonObject(text);
  const variants = Array.isArray(payload?.variants) ? payload.variants : [];

  const suggestions = variants
    .map((variant, index) => {
      if (!variant || typeof variant !== "object") return null;
      const label = typeof variant.label === "string" ? variant.label.trim() : "";
      const detail = typeof variant.detail === "string" ? variant.detail.trim() : "";
      const value = typeof variant.text === "string" ? cleanSummaryText(variant.text) : "";
      if (!value) return null;

      return {
        id: `remote-summary-${index + 1}`,
        label: label || `远程摘要建议 ${index + 1}`,
        detail: detail || "基于当前简历内容和岗位信息生成。",
        previewLines: value.split(/\n+/).filter(Boolean).slice(0, 3),
        applyLabel: "应用远程摘要",
        target: "summary",
        nextValue: value,
      } satisfies ResumeAssistSuggestion;
    })
    .filter(Boolean) as ResumeAssistSuggestion[];

  if (suggestions.length > 0) {
    return suggestions.slice(0, 2);
  }

  const fallback = cleanSummaryText(text);
  return [
    {
      id: "remote-summary-fallback",
      label: "远程摘要建议",
      detail: "基于当前简历内容和岗位信息生成。",
      previewLines: fallback.split(/\n+/).filter(Boolean).slice(0, 3),
      applyLabel: "应用远程摘要",
      target: "summary",
      nextValue: fallback,
    },
  ];
}

export async function generateRemoteItemSuggestions(
  document: ResumeDocument,
  sectionType: ResumeSectionType,
  item: ResumeSectionItem,
  apiKeyOverride?: string,
): Promise<ResumeAssistSuggestion[]> {
  const text = await requestRemoteResumeAiText(
    document.ai,
    buildRemoteItemAssistMessages(document, sectionType, item),
    0.35,
    apiKeyOverride,
  );
  const payload = extractJsonObject(text);

  if (sectionType === "skills") {
    const tags = Array.isArray(payload?.tags)
      ? Array.from(
          new Set(
            payload.tags
              .filter((tag): tag is string => typeof tag === "string")
              .map((tag) => tag.trim())
              .filter(Boolean),
          ),
        )
      : cleanTagLines(text);

    if (tags.length === 0) {
      throw new Error("Remote AI did not return usable skill tags.");
    }

    return [
      {
        id: "remote-tags",
        label: "远程技能整理",
        detail:
          typeof payload?.detail === "string" && payload.detail.trim()
            ? payload.detail.trim()
            : "基于当前技能和岗位信息整理出更适合简历展示的技能标签。",
        previewLines: tags.slice(0, 8),
        applyLabel: "应用技能整理",
        target: "tags",
        nextValue: tags,
      },
    ];
  }

  const summary = typeof payload?.summary === "string" ? cleanSummaryText(payload.summary) : "";
  const bullets = Array.isArray(payload?.bullets)
    ? payload.bullets
        .filter((line): line is string => typeof line === "string")
        .map((line) => line.trim())
        .filter(Boolean)
    : cleanBulletLines(text);
  const detail =
    typeof payload?.detail === "string" && payload.detail.trim()
      ? payload.detail.trim()
      : "基于当前经历和岗位信息生成。";

  const suggestions: ResumeAssistSuggestion[] = [];

  if (summary) {
    suggestions.push({
      id: "remote-item-summary",
      label: "远程经历说明",
      detail,
      previewLines: summary.split(/\n+/).filter(Boolean).slice(0, 3),
      applyLabel: "应用经历说明",
      target: "summary",
      nextValue: summary,
    });
  }

  if (bullets.length > 0) {
    suggestions.push({
      id: "remote-item-bullets",
      label: "远程经历要点",
      detail,
      previewLines: bullets.slice(0, 4),
      applyLabel: "应用经历要点",
      target: "bullets",
      nextValue: bullets,
    });
  }

  if (suggestions.length === 0) {
    throw new Error("Remote AI did not return usable resume suggestions.");
  }

  return suggestions.slice(0, 2);
}
