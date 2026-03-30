import { resumeWriterProfileMeta } from "@/lib/resume-document";
import { stripHtml } from "@/lib/utils";
import type {
  ResumeDocument,
  ResumeSectionItem,
  ResumeSectionType,
  ResumeWriterProfile,
} from "@/types/resume";

export interface ResumeAssistIssue {
  id: string;
  title: string;
  detail: string;
  tone: "neutral" | "warning";
}

export interface ResumeAssistSuggestion {
  id: string;
  label: string;
  detail: string;
  previewLines: string[];
  applyLabel: string;
  target: "summary" | "bullets" | "tags";
  nextValue: string | string[];
}

export interface ResumeAssistPack {
  issues: ResumeAssistIssue[];
  suggestions: ResumeAssistSuggestion[];
}

const weakLeadingPatterns: Array<[RegExp, string]> = [
  [/^负责/u, "主导"],
  [/^参与并负责/u, "参与并推进"],
  [/^参与/u, "参与并推进"],
  [/^协助/u, "协同支持"],
  [/^支持/u, "支持并落地"],
  [/^跟进/u, "跟进并推动"],
  [/^熟悉/u, "具备"],
  [/^了解/u, "理解并应用"],
];

const resultSignalPattern =
  /\d|提升|增长|降低|减少|节省|缩短|覆盖|达成|转化|营收|效率|留存|上线|交付|reduced|increased|improved|launched|shipped|saved|grew|cut\b/i;

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").replace(/[；;]/g, "，").trim();
}

function ensureSentence(value: string) {
  const cleaned = cleanLine(value).replace(/[。；;，,]+$/u, "");
  return cleaned ? `${cleaned}。` : "";
}

function polishLeadVerb(value: string) {
  let next = cleanLine(value);

  for (const [pattern, replacement] of weakLeadingPatterns) {
    if (pattern.test(next)) {
      next = next.replace(pattern, replacement);
      break;
    }
  }

  return ensureSentence(next);
}

function splitSentences(value: string) {
  return value
    .split(/[\n。！？!?]+/u)
    .map((line) => cleanLine(line))
    .filter(Boolean);
}

function uniqueList(values: string[]) {
  return Array.from(new Set(values.map((value) => cleanLine(value)).filter(Boolean)));
}

function hasResultSignal(value: string) {
  return resultSignalPattern.test(value);
}

function resolveFocusLabel(document: ResumeDocument) {
  return (
    document.basics.headline.trim() ||
    document.targeting.role.trim() ||
    resumeWriterProfileMeta[document.meta.writerProfile].label
  );
}

function countSectionItems(document: ResumeDocument, type: ResumeSectionType) {
  return document.sections
    .filter((section) => section.type === type)
    .reduce((sum, section) => sum + section.items.length, 0);
}

function collectTopTags(document: ResumeDocument) {
  return uniqueList(
    document.sections.flatMap((section) =>
      section.items.flatMap((item) => [...item.tags, item.meta].filter(Boolean)),
    ),
  ).slice(0, 3);
}

function collectEvidenceLines(document: ResumeDocument) {
  return document.sections
    .flatMap((section) => section.items.flatMap((item) => item.bulletPoints))
    .map((line) => cleanLine(line))
    .filter(Boolean);
}

function buildGeneratedSummary(document: ResumeDocument, variant: "concise" | "professional" | "steady") {
  const writerProfile = document.meta.writerProfile;
  const focusLabel = resolveFocusLabel(document);
  const experienceCount = countSectionItems(document, "experience");
  const projectCount = countSectionItems(document, "projects");
  const topTags = collectTopTags(document);
  const evidenceLines = collectEvidenceLines(document);
  const resultBulletCount = evidenceLines.filter(hasResultSignal).length;
  const tagPhrase = topTags.length > 0 ? `，覆盖 ${topTags.join(" / ")} 等方向` : "";

  if (writerProfile === "campus") {
    const base =
      variant === "concise"
        ? `聚焦 ${focusLabel} 方向，已整理 ${Math.max(projectCount, 1)} 段项目或实习内容${tagPhrase}。`
        : variant === "professional"
          ? `聚焦 ${focusLabel} 方向，当前已整理 ${Math.max(projectCount, 1)} 段项目或实习内容${tagPhrase}，可快速补齐为结果导向的简历表达。`
          : `面向 ${focusLabel} 方向求职，已沉淀 ${Math.max(projectCount, 1)} 段项目或实习经历${tagPhrase}，能够围绕目标岗位继续提炼职责、动作与成果。`;
    return ensureSentence(base);
  }

  if (writerProfile === "career-switch") {
    const base =
      variant === "concise"
        ? `正在转向 ${focusLabel} 方向，已整理 ${Math.max(experienceCount + projectCount, 1)} 段可迁移经历${tagPhrase}。`
        : variant === "professional"
          ? `正在转向 ${focusLabel} 方向，已整理 ${Math.max(experienceCount + projectCount, 1)} 段可迁移经历${tagPhrase}，适合继续强化转型相关的职责与结果表达。`
          : `面向 ${focusLabel} 方向转型，当前已沉淀 ${Math.max(experienceCount + projectCount, 1)} 段可迁移经历${tagPhrase}，建议继续突出与目标岗位最相关的能力证明。`;
    return ensureSentence(base);
  }

  const base =
    variant === "concise"
      ? `聚焦 ${focusLabel} 方向，当前已整理 ${Math.max(experienceCount, 1)} 段相关经历${tagPhrase}。`
      : variant === "professional"
        ? `聚焦 ${focusLabel} 方向，当前已整理 ${Math.max(experienceCount, 1)} 段相关经历${tagPhrase}，可继续强化结果导向与业务影响表达。`
        : `围绕 ${focusLabel} 方向持续积累相关经历${tagPhrase}，当前草稿已具备基础内容骨架，适合继续补齐业务结果与关键贡献。`;

  if (resultBulletCount > 0 && variant !== "concise") {
    return ensureSentence(`${base} 草稿中已有 ${resultBulletCount} 条带结果信号的经历描述，可进一步压缩成更有说服力的摘要。`);
  }

  return ensureSentence(base);
}

function buildPolishedSummary(value: string) {
  const sentences = splitSentences(value).slice(0, 3);
  if (sentences.length === 0) return "";
  return sentences.map((sentence) => ensureSentence(sentence)).join("");
}

function buildBulletSummary(item: ResumeSectionItem, sectionType: ResumeSectionType) {
  const bullets = item.bulletPoints.map((line) => cleanLine(line)).filter(Boolean);
  if (bullets.length === 0) return "";

  const leading = sectionType === "projects" ? "围绕项目推进" : "围绕核心职责推进";
  const title = [item.title, item.subtitle].filter(Boolean).join(" / ");
  const tags = item.tags.length > 0 ? `，涉及 ${item.tags.slice(0, 3).join(" / ")}` : "";
  const firstBullet = bullets[0] ? ensureSentence(polishLeadVerb(bullets[0]).replace(/。$/u, "")) : "";

  return ensureSentence(`${title || "该段经历"}${tags}，${leading}并形成可写入简历的成果表达`) + (firstBullet || "");
}

function buildBulletsFromSummary(summary: string) {
  return splitSentences(summary)
    .slice(0, 3)
    .map((sentence) => polishLeadVerb(sentence));
}

function buildResultPromptBullets(bullets: string[]) {
  return bullets.map((bullet) =>
    hasResultSignal(bullet)
      ? polishLeadVerb(bullet)
      : ensureSentence(`${cleanLine(bullet)}，建议补充对应结果或影响`),
  );
}

export function buildBasicsAssistPack(document: ResumeDocument): ResumeAssistPack {
  const summaryText = stripHtml(document.basics.summaryHtml);
  const suggestions: ResumeAssistSuggestion[] = [];
  const issues: ResumeAssistIssue[] = [];
  const summaryLength = summaryText.length;

  if (!document.basics.headline.trim() && !document.targeting.role.trim()) {
    issues.push({
      id: "missing-positioning",
      title: "建议先补求职方向",
      detail: "没有职业标题或目标岗位时，摘要容易变得空泛，先补定位会让改写更稳。",
      tone: "warning",
    });
  }

  if (summaryLength === 0) {
    issues.push({
      id: "missing-summary",
      title: "摘要尚未开始",
      detail: "先用 2 到 3 句话写清方向、优势和证据，再继续润色最有效。",
      tone: "warning",
    });
  } else if (summaryLength < 40) {
    issues.push({
      id: "short-summary",
      title: "摘要偏短",
      detail: "当前更像标签式信息，建议补到 2 到 3 句，至少覆盖方向、优势和证据。",
      tone: "warning",
    });
  } else {
    issues.push({
      id: "controlled-rewrite",
      title: "改写会保持保守",
      detail: "以下建议只基于当前草稿整理，不会自动编造结果，也不会直接覆盖原文。",
      tone: "neutral",
    });
  }

  if (summaryText.trim()) {
    const polishedSummary = buildPolishedSummary(summaryText);
    if (polishedSummary && polishedSummary !== summaryText) {
      suggestions.push({
        id: "summary-polish",
        label: "润色当前摘要",
        detail: "保留原有事实，只整理语气、句式和节奏。",
        previewLines: splitSentences(stripHtml(polishedSummary)).slice(0, 3),
        applyLabel: "应用润色版",
        target: "summary",
        nextValue: stripHtml(polishedSummary),
      });
    }
  }

  for (const variant of ["concise", "professional", "steady"] as const) {
    const nextValue = buildGeneratedSummary(document, variant);
    suggestions.push({
      id: `generated-${variant}`,
      label:
        variant === "concise" ? "简洁版摘要" : variant === "professional" ? "专业版摘要" : "稳妥版摘要",
      detail:
        variant === "concise"
          ? "更适合先把摘要补齐成一句能用的话。"
          : variant === "professional"
            ? "更强调岗位方向与已沉淀内容，适合大多数正式场景。"
            : "语气更克制，适合担心过度美化时使用。",
      previewLines: splitSentences(stripHtml(nextValue)).slice(0, 3),
      applyLabel: "应用这个版本",
      target: "summary",
      nextValue: stripHtml(nextValue),
    });
  }

  return {
    issues,
    suggestions: suggestions.slice(0, 4),
  };
}

export function buildItemAssistPack(
  sectionType: ResumeSectionType,
  item: ResumeSectionItem,
  writerProfile: ResumeWriterProfile,
): ResumeAssistPack {
  const summaryText = stripHtml(item.summaryHtml);
  const bullets = item.bulletPoints.map((line) => cleanLine(line)).filter(Boolean);
  const normalizedTags = uniqueList(item.tags);
  const issues: ResumeAssistIssue[] = [];
  const suggestions: ResumeAssistSuggestion[] = [];
  const weakBullets = bullets.filter((line) => line !== polishLeadVerb(line).replace(/。$/u, ""));

  if (sectionType === "skills") {
    if (normalizedTags.length === 0) {
      issues.push({
        id: "missing-skills",
        title: "技能项还没有整理出来",
        detail: "先补 4 到 8 个最相关的技能词，再决定是否继续做岗位定制。",
        tone: "warning",
      });
    } else {
      issues.push({
        id: "skills-focused",
        title: "只保留岗位相关技能",
        detail: "技能区更适合保留工具、框架、语言和领域关键词，不要混入职责句子。",
        tone: "neutral",
      });

      if (normalizedTags.join("|") !== item.tags.join("|")) {
        suggestions.push({
          id: "normalize-tags",
          label: "整理技能标签",
          detail: "去重并清理空白，保留更适合简历展示的技能列表。",
          previewLines: normalizedTags.slice(0, 8),
          applyLabel: "应用技能整理",
          target: "tags",
          nextValue: normalizedTags,
        });
      }
    }

    return {
      issues,
      suggestions: suggestions.slice(0, 2),
    };
  }

  if (bullets.length === 0 && !summaryText) {
    issues.push({
      id: "missing-content",
      title: "这一段内容还很空",
      detail: "建议至少补一条职责或成果，再让 AI 帮你整理成简历表达。",
      tone: "warning",
    });
  }

  if (bullets.length > 0 && !bullets.some(hasResultSignal)) {
    issues.push({
      id: "missing-results",
      title: "缺少结果信号",
      detail: "当前多是职责描述，建议补充效率、质量、规模、交付或业务影响。",
      tone: "warning",
    });
  }

  if (weakBullets.length > 0) {
    issues.push({
      id: "weak-verb",
      title: "可替换更强动作词",
      detail: "像“负责 / 参与 / 协助”这样的开头较弱，换成更具体的动作会更像简历。",
      tone: "neutral",
    });
  }

  if (!summaryText && bullets.length > 0) {
    const nextSummary = buildBulletSummary(item, sectionType);
    if (nextSummary) {
      suggestions.push({
        id: "summary-from-bullets",
        label: "补一段简历式说明",
        detail: "把现有要点先整理成一句更像简历的概括，适合放在经历说明里。",
        previewLines: splitSentences(stripHtml(nextSummary)).slice(0, 3),
        applyLabel: "应用说明",
        target: "summary",
        nextValue: stripHtml(nextSummary),
      });
    }
  }

  if (summaryText && bullets.length === 0) {
    const nextBullets = buildBulletsFromSummary(summaryText);
    if (nextBullets.length > 0) {
      suggestions.push({
        id: "bullets-from-summary",
        label: "从说明拆成要点",
        detail: "把一段说明拆成更适合简历浏览的逐条表达。",
        previewLines: nextBullets.slice(0, 3),
        applyLabel: "应用要点",
        target: "bullets",
        nextValue: nextBullets,
      });
    }
  }

  if (bullets.length > 0) {
    const polishedBullets = bullets.map((bullet) => polishLeadVerb(bullet));
    suggestions.push({
      id: "polish-bullets",
      label: writerProfile === "campus" ? "润色项目/实习要点" : "润色经历要点",
      detail: "只强化动作表达，不额外虚构数据。",
      previewLines: polishedBullets.slice(0, 3),
      applyLabel: "应用润色版",
      target: "bullets",
      nextValue: polishedBullets,
    });

    if (!bullets.some(hasResultSignal)) {
      const resultPromptBullets = buildResultPromptBullets(bullets);
      suggestions.push({
        id: "result-reminder-bullets",
        label: "生成结果提醒版",
        detail: "不会替你编数字，但会把需要补结果的位置明确标出来。",
        previewLines: resultPromptBullets.slice(0, 3),
        applyLabel: "应用提醒版",
        target: "bullets",
        nextValue: resultPromptBullets,
      });
    }
  }

  return {
    issues,
    suggestions: suggestions.slice(0, 3),
  };
}
