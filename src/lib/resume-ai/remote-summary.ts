import { stripHtml, textToHtml } from "@/lib/utils";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeAiMessage } from "@/lib/resume-ai/types";
import { cleanSummaryText } from "@/lib/resume-ai/parsing";
import { canUseRemoteResumeAi, getRemoteResumeAiConfigError } from "@/lib/resume-ai/config";
import { collectEvidenceLines, requestRemoteResumeAiText } from "@/lib/resume-ai/remote-client";

function buildSummaryMessages(document: ResumeDocument): ResumeAiMessage[] {
  const evidenceLines = collectEvidenceLines(document);
  const currentSummary = stripHtml(document.basics.summaryHtml);
  const focusKeywords = document.targeting.focusKeywords.join(", ");
  const jdExcerpt = document.targeting.jobDescription.trim().slice(0, 1200);

  return [
    {
      role: "system",
      content: "你是简历写作助手。只基于用户提供的事实整理成中文简历摘要，不要编造经历、指标、公司背景或技术栈。",
    },
    {
      role: "user",
      content: [
        "请输出 2 到 3 句中文简历摘要。",
        "要求：",
        "1. 只保留与目标岗位最相关的信息。",
        "2. 不要使用项目符号、标题、引号或解释。",
        "3. 如果缺少量化结果，不要编造数字。",
        "4. 语气专业、克制，适合直接放进简历摘要。",
        "",
        `目标岗位：${document.targeting.role || "未填写"}`,
        `目标公司：${document.targeting.company || "未填写"}`,
        `关键词：${focusKeywords || "未填写"}`,
        `JD：${jdExcerpt || "未填写"}`,
        `当前标题：${document.basics.headline || "未填写"}`,
        `当前摘要：${currentSummary || "未填写"}`,
        "经历证据：",
        ...(evidenceLines.length > 0 ? evidenceLines.map((line) => `- ${line}`) : ["- 未提供更多经历证据"]),
      ].join("\n"),
    },
  ];
}

export { canUseRemoteResumeAi, getRemoteResumeAiConfigError };

export async function generateRemoteResumeSummary(document: ResumeDocument, apiKeyOverride?: string) {
  const text = await requestRemoteResumeAiText(document.ai, buildSummaryMessages(document), 0.3, apiKeyOverride);
  const summary = cleanSummaryText(text);

  if (!summary) {
    throw new Error("Remote AI returned an empty summary.");
  }

  return summary;
}

export function applySummaryText(document: ResumeDocument, summary: string): ResumeDocument {
  return {
    ...document,
    basics: {
      ...document.basics,
      summaryHtml: textToHtml(summary),
    },
  };
}
