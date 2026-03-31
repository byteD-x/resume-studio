import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createEmptyResumeDocument, validateResumeDocument } from "@/lib/resume-document";
import { buildBasicsImportFieldSuggestions } from "@/lib/resume-import-review";
import { createId, nowIso, textToHtml } from "@/lib/utils";
import type { ResumeDocument, ResumeSection, ResumeSectionItem } from "@/types/resume";

const MAX_PDF_IMPORT_PAGES = 20;

export interface RawPdfLine {
  page: number;
  text: string;
  x: number;
  y: number;
  fontName: string;
  fontSize: number;
}

interface ImportedPdfSection {
  heading: string;
  lines: string[];
}

const headingSectionMap = new Map<string, ResumeSection["type"]>([
  ["summary", "summary"],
  ["professional summary", "summary"],
  ["profile", "summary"],
  ["about", "summary"],
  ["overview", "summary"],
  ["experience", "experience"],
  ["work experience", "experience"],
  ["professional experience", "experience"],
  ["employment", "experience"],
  ["projects", "projects"],
  ["selected projects", "projects"],
  ["project experience", "projects"],
  ["education", "education"],
  ["education background", "education"],
  ["skills", "skills"],
  ["technical skills", "skills"],
  ["core skills", "skills"],
  ["工作经历", "experience"],
  ["项目经历", "projects"],
  ["项目", "projects"],
  ["教育经历", "education"],
  ["教育背景", "education"],
  ["技能", "skills"],
  ["专业技能", "skills"],
  ["个人简介", "summary"],
  ["职业摘要", "summary"],
  ["摘要", "summary"],
]);

function normalizeImportedLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeHeadingKey(value: string) {
  return normalizeImportedLine(value)
    .replace(/[：:]+$/, "")
    .toLowerCase();
}

function joinTextFragments(fragments: string[]) {
  let combined = "";

  for (const fragment of fragments.map(normalizeImportedLine).filter(Boolean)) {
    if (!combined) {
      combined = fragment;
      continue;
    }

    if (combined.endsWith("-")) {
      combined = `${combined.slice(0, -1)}${fragment}`;
      continue;
    }

    if (/[(/[{-]$/.test(combined) || /^[,.;:!?)}\]]/.test(fragment)) {
      combined += fragment;
      continue;
    }

    combined += ` ${fragment}`;
  }

  return normalizeImportedLine(combined);
}

function resolveSectionType(heading: string) {
  const normalized = normalizeHeadingKey(heading);
  return headingSectionMap.get(normalized) ?? "custom";
}

function buildSectionTitle(heading: string, type: ResumeSection["type"]) {
  const normalized = normalizeHeadingKey(heading);
  if (headingSectionMap.has(normalized)) {
    return heading.replace(/[：:]+$/, "");
  }

  switch (type) {
    case "summary":
      return "摘要";
    case "experience":
      return "工作经历";
    case "projects":
      return "项目经历";
    case "education":
      return "教育经历";
    case "skills":
      return "技能";
    default:
      return "导入内容";
  }
}

function splitSkillTags(lines: string[]) {
  return Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/[\n,，、•·|/]/))
        .map((entry) => normalizeImportedLine(entry))
        .filter((entry) => entry.length > 0 && entry.length <= 48),
    ),
  );
}

function isBulletLine(line: string) {
  return /^[-*•▪◦]\s+/.test(line);
}

function cleanBulletLine(line: string) {
  return normalizeImportedLine(line.replace(/^[-*•▪◦]\s+/, ""));
}

function extractDateRangeValue(line: string) {
  const dateToken = String.raw`(?:19|20)\d{2}(?:[./-]\d{1,2}|年\s*\d{1,2}\s*月?)?`;
  const openEndedToken = String.raw`(?:present|current|now|today|ongoing|至今|目前|现今|现在|在读|在校)`;
  const rangePattern = new RegExp(
    String.raw`\b${dateToken}(?:\s*(?:[-–—~]|至|to|until)\s*(?:${openEndedToken}|${dateToken})|\s+${openEndedToken})`,
    "i",
  );
  const singleDatePattern = new RegExp(String.raw`\b${dateToken}`, "i");

  const rangeMatch = line.match(rangePattern);
  if (rangeMatch?.[0]) {
    return normalizeImportedLine(rangeMatch[0]);
  }

  const singleMatch = line.match(singleDatePattern);
  return singleMatch?.[0] ? normalizeImportedLine(singleMatch[0]) : "";
}

function hasCjkCharacters(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

function hasLatinCharacters(value: string) {
  return /[A-Za-z]/.test(value);
}

function isMostlyCjkPhrase(value: string) {
  return hasCjkCharacters(value) && !hasLatinCharacters(value);
}

function isMostlyLatinPhrase(value: string) {
  return hasLatinCharacters(value) && !hasCjkCharacters(value);
}

function areLikelyBilingualVariants(left: string, right: string) {
  return (
    left.length > 0
    && right.length > 0
    && left.length <= 64
    && right.length <= 64
    && (
      (hasCjkCharacters(left) && hasLatinCharacters(right))
      || (hasLatinCharacters(left) && hasCjkCharacters(right))
    )
  );
}

function areSeparatedBilingualPhrases(left: string, right: string) {
  return (
    left.length > 0
    && right.length > 0
    && (
      (isMostlyLatinPhrase(left) && isMostlyCjkPhrase(right))
      || (isMostlyCjkPhrase(left) && isMostlyLatinPhrase(right))
    )
  );
}

function looksLikeRoleSegment(value: string) {
  return /\b(engineer|developer|designer|manager|lead|intern|consultant|architect|analyst|specialist|director|scientist|researcher)\b/i
    .test(value)
    || /(工程师|开发|设计师|经理|负责人|实习|顾问|架构师|产品|运营|分析师|研究员|主管|总监)/.test(value);
}

function looksLikeOrganizationSegment(value: string) {
  return /\b(inc|llc|ltd|corp|corporation|company|group|studio|labs|lab|systems|technologies|technology|tech|software|network|digital|media|partners|ventures|university|college)\b/i
    .test(value)
    || /(公司|集团|科技|网络|信息|大学|学院|银行|医院|研究院|实验室|中心|工作室)/.test(value);
}

function looksLikeEducationInstitutionSegment(value: string) {
  return /\b(university|college|school|academy|institute|polytechnic)\b/i.test(value)
    || /(大学|学院|学校|中学|研究院|研究所)/.test(value);
}

function looksLikeEducationDegreeSegment(value: string) {
  return /\b(bachelor|master|phd|doctor|mba|bsc|msc|ba|ma|bs|ms|associate|diploma)\b/i.test(value)
    || /(本科|硕士|博士|学士|专科|大专|研究生|高中|中专|学历)/.test(value);
}

function looksLikeLocationSegment(value: string) {
  return /\b(remote|hybrid|onsite|on-site|beijing|shanghai|shenzhen|guangzhou|hangzhou|nanjing|wuhan|chengdu|xian|suzhou|tianjin|chongqing|hong kong|singapore|tokyo|seoul|london|new york|san francisco|los angeles|boston)\b/i
    .test(value)
    || /(北京|上海|深圳|广州|杭州|南京|武汉|成都|西安|苏州|天津|重庆|香港|澳门|新加坡|东京|伦敦|纽约|远程|混合办公|现场)/.test(value);
}

function isPureLocationValue(value: string) {
  return looksLikeLocationSegment(value)
    && !looksLikeRoleSegment(value)
    && !looksLikeOrganizationSegment(value)
    && !looksLikeEducationInstitutionSegment(value)
    && !looksLikeEducationDegreeSegment(value);
}

function mergeBilingualHeaderSegments(segments: string[]) {
  const merged: string[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const current = segments[index] ?? "";
    const next = segments[index + 1] ?? "";
    const laterSegments = segments.slice(index + 2);
    const hasRoleLater = laterSegments.some((segment) => looksLikeRoleSegment(segment));
    const hasEducationLater = laterSegments.some((segment) =>
      looksLikeEducationInstitutionSegment(segment) || looksLikeEducationDegreeSegment(segment),
    );
    const shouldMerge =
      !!next
      && areLikelyBilingualVariants(current, next)
      && (
        (looksLikeRoleSegment(current) && looksLikeRoleSegment(next))
        || (looksLikeLocationSegment(current) && looksLikeLocationSegment(next))
        || (looksLikeEducationInstitutionSegment(current) && looksLikeEducationInstitutionSegment(next))
        || (looksLikeEducationDegreeSegment(current) && looksLikeEducationDegreeSegment(next))
        || (
          !looksLikeRoleSegment(current)
          && !looksLikeRoleSegment(next)
          && !looksLikeLocationSegment(current)
          && !looksLikeLocationSegment(next)
          && !looksLikeEducationDegreeSegment(current)
          && !looksLikeEducationDegreeSegment(next)
          && (
            looksLikeOrganizationSegment(current)
            || looksLikeOrganizationSegment(next)
            || (index === 0 && hasRoleLater)
            || (index === 0 && hasEducationLater)
          )
        )
      );

    if (shouldMerge) {
      merged.push(`${current} / ${next}`);
      index += 1;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function mergeBilingualEducationDescriptorSegments(segments: string[]) {
  const merged: string[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const current = segments[index] ?? "";
    const next = segments[index + 1] ?? "";
    const shouldMerge =
      !!next
      && areLikelyBilingualVariants(current, next)
      && !looksLikeLocationSegment(current)
      && !looksLikeLocationSegment(next)
      && !looksLikeEducationDegreeSegment(current)
      && !looksLikeEducationDegreeSegment(next)
      && !looksLikeEducationInstitutionSegment(current)
      && !looksLikeEducationInstitutionSegment(next)
      && !looksLikeRoleSegment(current)
      && !looksLikeRoleSegment(next)
      && !looksLikeOrganizationSegment(current)
      && !looksLikeOrganizationSegment(next);

    if (shouldMerge) {
      merged.push(`${current} / ${next}`);
      index += 1;
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function looksLikeMetaLine(line: string) {
  return (
    line.includes("·")
    || line.includes("|")
    || line.includes("•")
    || !!extractDateRangeValue(line)
  );
}

function isStandaloneMetaLine(line: string) {
  const dateRange = extractDateRangeValue(line);
  if (!dateRange) return false;

  const withoutDate = normalizeImportedLine(line.replace(dateRange, " "));
  if (!withoutDate) return true;

  const segments = withoutDate
    .split(/\s*[·|•｜]\s*|\s+[/-]\s+/)
    .map(normalizeImportedLine)
    .filter(Boolean);

  return segments.length > 0
    && segments.length <= 2
    && segments.every((segment) =>
      !looksLikeRoleSegment(segment)
      && !looksLikeOrganizationSegment(segment)
      && !looksLikeEducationInstitutionSegment(segment)
      && !looksLikeEducationDegreeSegment(segment),
    );
}

function isPotentialEntryHeading(line: string) {
  const normalized = normalizeImportedLine(line);
  if (!normalized || isBulletLine(normalized)) return false;
  if (resolveSectionType(normalized) !== "custom") return false;
  if (/[:：]/.test(normalized)) return false;
  if (/[。.!?；;:]$/.test(normalized)) return false;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(normalized) || /https?:\/\/|www\./i.test(normalized)) {
    return false;
  }
  if (isStandaloneMetaLine(normalized)) return false;
  if (looksLikeInlineEntryHeader(normalized)) return true;

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  return normalized.length <= 72 && wordCount <= 10;
}

function splitStructuredEntryBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = normalizeImportedLine(lines[index] ?? "");
    if (!line) continue;

    const nextLine = normalizeImportedLine(lines[index + 1] ?? "");
    const currentLooksLikeIncompleteHeader =
      current.length === 1
      && (isStandaloneMetaLine(current[0] ?? "") || isRoleOnlyLine(current[0] ?? ""));
    const currentLooksLikeSingleLineEntry =
      current.length === 1
      && !currentLooksLikeIncompleteHeader
      && looksLikeInlineEntryHeader(current[0] ?? "");
    const currentLooksLikeDisorderedHeader =
      current.length === 2
      && (
        (isStandaloneMetaLine(current[0] ?? "") && isOrganizationOnlyLine(current[1] ?? "") && isRoleOnlyLine(line))
        || (isRoleOnlyLine(current[0] ?? "") && isOrganizationOnlyLine(current[1] ?? "") && looksLikeMetaLine(line))
        || (isOrganizationOnlyLine(current[0] ?? "") && isStandaloneMetaLine(current[1] ?? "") && isRoleOnlyLine(line))
      );
    const shouldStartNewBlock =
      current.length > 0
      && !currentLooksLikeIncompleteHeader
      && !currentLooksLikeDisorderedHeader
      && isPotentialEntryHeading(line)
      && (
        looksLikeMetaLine(nextLine)
        || current.length >= 2
        || currentLooksLikeSingleLineEntry
        || current.some((entry) => isBulletLine(entry))
      );

    if (shouldStartNewBlock) {
      blocks.push(current);
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current);
  }

  return blocks;
}

function parseMetaLine(line: string) {
  const dateRange = extractDateRangeValue(line);
  const withoutDate = dateRange ? line.replace(dateRange, " ") : line;
  const segments = withoutDate
    .split(/\s*[·|•｜]\s*|\s+[/-]\s+/)
    .map(normalizeImportedLine)
    .filter(Boolean);

  if (segments.length === 1 && !/\d/.test(segments[0] ?? "") && (segments[0]?.length ?? 0) <= 40) {
    return {
      subtitle: looksLikeRoleSegment(segments[0] ?? "") ? (segments[0] ?? "") : "",
      location: looksLikeRoleSegment(segments[0] ?? "") ? "" : (segments[0] ?? ""),
      dateRange,
      meta: "",
    };
  }

  let subtitle = "";
  let location = "";
  const metaParts: string[] = [];

  for (const segment of segments) {
    if (!subtitle) {
      subtitle = segment;
      continue;
    }

    if (!location && !/\d/.test(segment) && segment.length <= 40) {
      location = segment;
      continue;
    }

    metaParts.push(segment);
  }

  return {
    subtitle,
    location,
    dateRange,
    meta: metaParts.join(" · "),
  };
}

function parseRoleOrganizationPair(line: string) {
  const match = line.match(/^(.*?)\s+(?:@|at)\s+(.+)$/i);
  const roleMatch = normalizeImportedLine(match?.[1] ?? "");
  const organizationMatch = normalizeImportedLine(match?.[2] ?? "");

  if (!roleMatch || !organizationMatch) {
    return null;
  }

  return {
    role: roleMatch,
    organization: organizationMatch,
  };
}

function isRoleOnlyLine(line: string) {
  const normalized = normalizeImportedLine(line);
  return (
    !!normalized
    && looksLikeRoleSegment(normalized)
    && !looksLikeMetaLine(normalized)
    && !looksLikeOrganizationSegment(normalized)
    && !looksLikeLocationSegment(normalized)
  );
}

function isOrganizationOnlyLine(line: string) {
  const normalized = normalizeImportedLine(line);
  return (
    !!normalized
    && !looksLikeMetaLine(normalized)
    && !isRoleOnlyLine(normalized)
    && !looksLikeLocationSegment(normalized)
    && !/[。.!?；;:]$/.test(normalized)
    && normalized.length <= 96
  );
}

function normalizeStructuredHeaderBlock(lines: string[], type: ResumeSection["type"]) {
  if ((type !== "experience" && type !== "projects") || lines.length < 3) {
    return lines;
  }

  const [first, second, third, ...rest] = lines;
  if (!first || !second || !third) {
    return lines;
  }

  if (isOrganizationOnlyLine(first) && isRoleOnlyLine(second) && looksLikeMetaLine(third)) {
    return [first, `${second} · ${third}`, ...rest];
  }

  if (isOrganizationOnlyLine(first) && looksLikeMetaLine(second) && isRoleOnlyLine(third)) {
    return [first, `${third} · ${second}`, ...rest];
  }

  if (looksLikeMetaLine(first) && isOrganizationOnlyLine(second) && isRoleOnlyLine(third)) {
    return [second, `${third} · ${first}`, ...rest];
  }

  if (isRoleOnlyLine(first) && isOrganizationOnlyLine(second) && looksLikeMetaLine(third)) {
    return [second, `${first} · ${third}`, ...rest];
  }

  return lines;
}

function parseLooseEntryHeaderLine(line: string) {
  const tokens = normalizeImportedLine(line).split(/\s+/).filter(Boolean);
  if (tokens.length < 4) {
    return null;
  }

  let locationTokenCount = 0;
  if (tokens.length >= 2 && isPureLocationValue(tokens.slice(-2).join(" "))) {
    locationTokenCount = 2;
  } else if (isPureLocationValue(tokens[tokens.length - 1] ?? "")) {
    locationTokenCount = 1;
  }

  const coreTokens = locationTokenCount > 0 ? tokens.slice(0, -locationTokenCount) : tokens.slice();
  const location = locationTokenCount > 0 ? tokens.slice(-locationTokenCount).join(" ") : "";
  if (coreTokens.length < 3) {
    return null;
  }

  let roleStartIndex = -1;
  let roleEndIndex = -1;
  for (let start = 0; start < coreTokens.length; start += 1) {
    const latinBigram = coreTokens.slice(start, start + 2).join(" ");
    const latinTrigram = coreTokens.slice(start, start + 3).join(" ");
    const tokenStartsRole =
      looksLikeRoleSegment(coreTokens[start] ?? "")
      || (
        hasLatinCharacters(coreTokens[start] ?? "")
        && hasLatinCharacters(coreTokens[start + 1] ?? "")
        && looksLikeRoleSegment(latinBigram)
      )
      || (
        hasLatinCharacters(coreTokens[start] ?? "")
        && hasLatinCharacters(coreTokens[start + 1] ?? "")
        && hasLatinCharacters(coreTokens[start + 2] ?? "")
        && looksLikeRoleSegment(latinTrigram)
      );
    if (!tokenStartsRole) {
      continue;
    }

    for (let end = Math.min(coreTokens.length, start + 4); end > start; end -= 1) {
      const candidate = coreTokens.slice(start, end).join(" ");
      if (!looksLikeRoleSegment(candidate)) {
        continue;
      }

      roleStartIndex = start;
      roleEndIndex = end;
      break;
    }

    if (roleStartIndex >= 0) {
      break;
    }
  }

  if (roleStartIndex <= 0 || roleEndIndex <= roleStartIndex) {
    return null;
  }

  const organizationTokens = coreTokens.slice(0, roleStartIndex);
  const roleTokens = coreTokens.slice(roleStartIndex, roleEndIndex);
  const trailingTokens = coreTokens.slice(roleEndIndex);
  let roleTokenSplitIndex = -1;
  for (let index = 1; index < roleTokens.length; index += 1) {
    if (areSeparatedBilingualPhrases(roleTokens.slice(0, index).join(" "), roleTokens.slice(index).join(" "))) {
      roleTokenSplitIndex = index;
      break;
    }
  }
  const roleTailLooksLikeBilingualVariant =
    roleTokens.length >= 1
    && trailingTokens.length >= 1
    && areSeparatedBilingualPhrases(roleTokens.join(" "), trailingTokens.join(" "));
  const trailingIsBilingualRole = trailingTokens.length > 0 && areLikelyBilingualVariants(
    roleTokens.join(" "),
    trailingTokens.join(" "),
  );

  return {
    title: organizationTokens.join(" "),
    subtitle: roleTailLooksLikeBilingualVariant
      ? [roleTokens.join(" "), trailingTokens.join(" ")].filter(Boolean).join(" / ")
      : roleTokenSplitIndex > 0
        ? [roleTokens.slice(0, roleTokenSplitIndex).join(" "), roleTokens.slice(roleTokenSplitIndex).join(" ")]
          .filter(Boolean)
          .join(" / ")
        : roleTokens.join(" "),
    location,
    meta: trailingIsBilingualRole || roleTokenSplitIndex > 0 ? "" : trailingTokens.join(" "),
    parsed: organizationTokens.length > 0 && roleTokens.length > 0,
  };
}

function parseEntryHeaderLine(line: string) {
  const normalized = normalizeImportedLine(line);
  const dateRange = extractDateRangeValue(normalized);
  const withoutDate = dateRange ? normalized.replace(dateRange, " ") : normalized;
  const directRoleOrganizationPair = parseRoleOrganizationPair(withoutDate);

  if (directRoleOrganizationPair) {
    return {
      title: directRoleOrganizationPair.organization,
      subtitle: directRoleOrganizationPair.role,
      location: "",
      dateRange,
      meta: "",
      parsed: true,
    };
  }

  const segments = withoutDate
    .split(/\s*[·|•｜]\s*|\s+[/-]\s+/)
    .map(normalizeImportedLine)
    .filter(Boolean);

  if (segments.length < 2) {
    const looseHeader = parseLooseEntryHeaderLine(withoutDate);
    return looseHeader
      ? {
          title: looseHeader.title,
          subtitle: looseHeader.subtitle,
          location: looseHeader.location,
          dateRange,
          meta: looseHeader.meta,
          parsed: looseHeader.parsed,
        }
      : {
          title: normalized,
          subtitle: "",
          location: "",
          dateRange,
          meta: "",
          parsed: false,
        };
  }

  const mergedSegments = mergeBilingualHeaderSegments(segments);
  const leadingPair = parseRoleOrganizationPair(mergedSegments[0] ?? "");
  const orderedSegments = leadingPair
    ? [leadingPair.organization, leadingPair.role, ...mergedSegments.slice(1)]
    : mergedSegments;
  const shouldSwapLeadingSegments =
    orderedSegments.length >= 2
    && looksLikeRoleSegment(orderedSegments[0] ?? "")
    && (
      looksLikeOrganizationSegment(orderedSegments[1] ?? "")
      || !looksLikeRoleSegment(orderedSegments[1] ?? "")
    );
  const [title, subtitleCandidate, ...rest] = shouldSwapLeadingSegments
    ? [orderedSegments[1] ?? "", orderedSegments[0] ?? "", ...orderedSegments.slice(2)]
    : orderedSegments;
  let location = "";
  const metaParts: string[] = [];

  for (const segment of rest) {
    if (!location && !/\d/.test(segment) && segment.length <= 40) {
      location = segment;
      continue;
    }

    metaParts.push(segment);
  }

  return {
    title,
    subtitle: subtitleCandidate ?? "",
    location,
    dateRange,
    meta: metaParts.join(" · "),
    parsed: true,
  };
}

function parseEducationHeaderLine(line: string) {
  const normalized = normalizeImportedLine(line);
  const dateRange = extractDateRangeValue(normalized);
  const withoutDate = dateRange ? normalized.replace(dateRange, " ") : normalized;
  const segments = withoutDate
    .split(/\s*[·|•｜]\s*|\s+[/-]\s+/)
    .map(normalizeImportedLine)
    .filter(Boolean);

  if (segments.length < 2) {
    return {
      title: normalized,
      subtitle: "",
      location: "",
      dateRange,
      meta: "",
      parsed: false,
    };
  }

  const mergedSegments = mergeBilingualEducationDescriptorSegments(mergeBilingualHeaderSegments(segments));
  const institutionIndex = mergedSegments.findIndex((segment) => looksLikeEducationInstitutionSegment(segment));
  const safeInstitutionIndex =
    institutionIndex >= 0
      ? institutionIndex
      : (looksLikeEducationDegreeSegment(mergedSegments[0] ?? "") && mergedSegments[1] ? 1 : 0);
  const title = mergedSegments[safeInstitutionIndex] ?? mergedSegments[0] ?? normalized;
  const remainingSegments = mergedSegments.filter((_, index) => index !== safeInstitutionIndex);

  const locationSegments = remainingSegments.filter((segment) => looksLikeLocationSegment(segment));
  const degreeSegments = remainingSegments.filter((segment) => looksLikeEducationDegreeSegment(segment));
  const descriptorSegments = remainingSegments.filter((segment) =>
    !looksLikeLocationSegment(segment) && !looksLikeEducationDegreeSegment(segment),
  );

  return {
    title,
    subtitle: [...descriptorSegments.slice(0, 1), ...degreeSegments].filter(Boolean).join(" · "),
    location: locationSegments[0] ?? "",
    dateRange,
    meta: descriptorSegments.slice(1).join(" · "),
    parsed: true,
  };
}

function looksLikeInlineEntryHeader(line: string) {
  const parsed = parseEntryHeaderLine(line);
  if (!parsed.parsed) return false;

  return (
    !!parsed.dateRange
    || !!parsed.location
    || looksLikeRoleSegment(parsed.subtitle)
  );
}

function looksLikeEducationMetaLine(line: string) {
  return /^(?:gpa|cgpa|绩点|平均绩点|honors?|awards?|scholarships?|奖学金|荣誉|奖项|排名|coursework|relevant coursework|courses|relevant courses|主修课程|核心课程|相关课程)[:：]?\s*/i
    .test(line);
}

function looksLikeEducationNarrativeLine(line: string) {
  return /^(?:research|research interests?|thesis|dissertation|capstone|毕业设计|毕业论文|论文题目|研究方向|研究课题|课题方向)[:：]?\s*/i
    .test(line);
}

function extractEducationContent(contentLines: string[]) {
  const metaParts: string[] = [];
  const summaryLines: string[] = [];
  const bulletPoints = contentLines
    .filter((line) => isBulletLine(line))
    .map(cleanBulletLine)
    .filter(Boolean);

  for (const line of contentLines.filter((entry) => !isBulletLine(entry))) {
    if (looksLikeEducationMetaLine(line)) {
      metaParts.push(line);
      continue;
    }

    if (looksLikeEducationNarrativeLine(line)) {
      summaryLines.push(line);
      continue;
    }

    if (/^(?:gpa|绩点)\b/i.test(line) || /(?:奖学金|荣誉|课程|coursework|courses)/i.test(line)) {
      metaParts.push(line);
      continue;
    }

    summaryLines.push(line);
  }

  return {
    meta: metaParts.join(" · "),
    summaryHtml: summaryLines.length > 0 ? textToHtml(summaryLines.join("\n")) : "",
    bulletPoints,
  };
}

function looksLikeProjectStackLine(line: string) {
  return /^(?:tech stack|stack|tools|technologies|built with|技术栈|技术选型|使用技术|核心技术)[:：]?\s*/i
    .test(line);
}

function extractProjectTags(line: string) {
  const normalized = normalizeImportedLine(
    line.replace(/^(?:tech stack|stack|tools|technologies|built with|技术栈|技术选型|使用技术|核心技术)[:：]?\s*/i, ""),
  );

  return Array.from(
    new Set(
      normalized
        .split(/[，,、|/·]/)
        .map((entry) => normalizeImportedLine(entry))
        .filter((entry) => entry.length > 0 && entry.length <= 48),
    ),
  );
}

function looksLikeProjectOutcomeLine(line: string) {
  return /(?:\d+%|\d+\s*(?:ms|s|sec|秒|分钟|天|周|月|年|x|倍|万|千|M|K)|提升|降低|减少|缩短|增长|节省|优化|improved|reduced|decreased|increased|grew|cut|saved|launched|shipped|delivered)/i
    .test(line);
}

function extractProjectContent(contentLines: string[]) {
  const tags = new Set<string>();
  const bulletPoints: string[] = [];
  const summaryLines: string[] = [];

  for (const line of contentLines) {
    if (isBulletLine(line)) {
      bulletPoints.push(cleanBulletLine(line));
      continue;
    }

    if (looksLikeProjectStackLine(line)) {
      for (const tag of extractProjectTags(line)) {
        tags.add(tag);
      }
      continue;
    }

    if (looksLikeProjectOutcomeLine(line) && line.length <= 160) {
      bulletPoints.push(line);
      continue;
    }

    summaryLines.push(line);
  }

  return {
    tags: Array.from(tags),
    summaryHtml: summaryLines.length > 0 ? textToHtml(summaryLines.join("\n")) : "",
    bulletPoints,
  };
}

function buildStructuredItems(lines: string[], type: ResumeSection["type"]) {
  return splitStructuredEntryBlocks(lines)
    .map((block) => {
      const normalizedBlock = normalizeStructuredHeaderBlock(
        block.map(normalizeImportedLine).filter(Boolean),
        type,
      );
      const headerInfo = type === "education"
        ? parseEducationHeaderLine(normalizedBlock[0] ?? "")
        : parseEntryHeaderLine(normalizedBlock[0] ?? "");
      const metaCandidate = normalizedBlock[1] ?? "";
      const hasMetaLine = looksLikeMetaLine(metaCandidate);
      const hasRoleOnlyMeta = !hasMetaLine && (type === "experience" || type === "projects") && isRoleOnlyLine(metaCandidate);
      const metaInfo = hasMetaLine ? parseMetaLine(metaCandidate) : hasRoleOnlyMeta ? {
        subtitle: metaCandidate,
        location: "",
        dateRange: "",
        meta: "",
      } : {
        subtitle: "",
        location: "",
        dateRange: "",
        meta: "",
      };
      const contentLines = normalizedBlock.slice(hasMetaLine || hasRoleOnlyMeta ? 2 : 1);
      const defaultBulletPoints = contentLines
        .filter((line) => isBulletLine(line))
        .map(cleanBulletLine)
        .filter(Boolean);
      const defaultSummaryLines = contentLines.filter((line) => !isBulletLine(line));
      const educationContent = type === "education" ? extractEducationContent(contentLines) : null;
      const projectContent = type === "projects" ? extractProjectContent(contentLines) : null;
      const bulletPoints = educationContent?.bulletPoints ?? defaultBulletPoints;
      const summaryHtml = educationContent?.summaryHtml
        ?? projectContent?.summaryHtml
        ?? (defaultSummaryLines.length > 0 ? textToHtml(defaultSummaryLines.join("\n")) : "");
      const finalBulletPoints = projectContent?.bulletPoints ?? bulletPoints;

      const mergedMeta = [headerInfo.meta, metaInfo.meta, educationContent?.meta ?? ""]
        .filter(Boolean)
        .join(" · ");

      return {
        id: createId("item"),
        title: headerInfo.title,
        subtitle: metaInfo.subtitle || headerInfo.subtitle,
        location: metaInfo.location || headerInfo.location,
        dateRange: metaInfo.dateRange || headerInfo.dateRange,
        meta: mergedMeta,
        summaryHtml,
        bulletPoints: finalBulletPoints,
        tags: projectContent?.tags ?? [],
      } satisfies ResumeSectionItem;
    })
    .filter((item) =>
      [item.title, item.subtitle, item.location, item.dateRange, item.meta, item.summaryHtml]
        .join("")
        .trim().length > 0 || item.bulletPoints.length > 0 || item.tags.length > 0,
    );
}

function buildPdfSection(section: ImportedPdfSection): ResumeSection {
  const type = resolveSectionType(section.heading);
  const title = buildSectionTitle(section.heading, type);

  if (type === "skills") {
    const tags = splitSkillTags(section.lines);
    return {
      id: createId("section"),
      type,
      title,
      visible: true,
      layout: "tag-grid",
      contentHtml: tags.length === 0 ? textToHtml(section.lines.join("\n")) : "",
      items: tags.length > 0
        ? [
            {
              id: createId("item"),
              title: "技能清单",
              subtitle: "",
              location: "",
              dateRange: "",
              meta: "",
              summaryHtml: "",
              bulletPoints: [],
              tags,
            },
          ]
        : [],
      };
  }

  if (type === "experience" || type === "projects" || type === "education") {
    const items = buildStructuredItems(section.lines, type);
    if (items.length > 0) {
      return {
        id: createId("section"),
        type,
        title,
        visible: true,
        layout: "stacked-list",
        contentHtml: "",
        items,
      };
    }
  }

  return {
    id: createId("section"),
    type,
    title,
    visible: true,
    layout: "rich-text",
    contentHtml: textToHtml(section.lines.join("\n")),
    items: [],
  };
}

function buildLinkLabel(url: string) {
  const normalized = url.toLowerCase();
  if (normalized.includes("github.com")) return "GitHub";
  if (normalized.includes("linkedin.com")) return "LinkedIn";
  if (normalized.includes("behance.net")) return "Behance";
  return "作品链接";
}

function normalizeUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function stripContactTokens(line: string) {
  const emailMatches = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  const urlMatches = line.match(/(?:https?:\/\/|www\.)\S+|(?:github|linkedin)\.com\/\S+/gi) ?? [];
  const phoneMatches = line.match(/(?:\+?\d[\d\s\-()]{6,}\d)/g) ?? [];

  let remainder = line;
  for (const value of [...emailMatches, ...urlMatches, ...phoneMatches]) {
    remainder = remainder.replace(value, " ");
  }

  remainder = remainder.replace(/[·•|/]/g, " ");

  return {
    emails: emailMatches.map(normalizeImportedLine),
    urls: urlMatches.map((value) => normalizeImportedLine(value).replace(/[.,;]+$/, "")),
    phones: phoneMatches.map(normalizeImportedLine),
    remainder: normalizeImportedLine(remainder),
  };
}

function extractBasicsFromPrelude(lines: string[], baseDocument: ResumeDocument) {
  const emails = new Set<string>();
  const urls = new Set<string>();
  const phones = new Set<string>();
  const narrativeLines: string[] = [];

  for (const line of lines) {
    const result = stripContactTokens(line);
    result.emails.forEach((value) => emails.add(value));
    result.urls.forEach((value) => urls.add(normalizeUrl(value)));
    result.phones.forEach((value) => phones.add(value));
    if (result.remainder) {
      narrativeLines.push(result.remainder);
    }
  }

  const name = narrativeLines[0] ?? baseDocument.basics.name;
  const headline = narrativeLines[1] ?? baseDocument.basics.headline;
  const remainingLines = narrativeLines.slice(2);
  const links = [...urls].map((url) => ({
    label: buildLinkLabel(url),
    url,
  }));

  return {
    basics: {
      ...baseDocument.basics,
      name,
      headline,
      email: [...emails][0] ?? baseDocument.basics.email,
      phone: [...phones][0] ?? baseDocument.basics.phone,
      website: [...urls][0] ?? baseDocument.basics.website,
      summaryHtml:
        remainingLines.length > 0
          ? textToHtml(remainingLines.join("\n"))
          : baseDocument.basics.summaryHtml,
      links: links.length > 0 ? links : baseDocument.basics.links,
    },
    remainingLines,
  };
}

export function groupPdfLines(lines: RawPdfLine[]) {
  const byPage = new Map<number, RawPdfLine[]>();

  for (const line of lines) {
    const current = byPage.get(line.page) ?? [];
    current.push(line);
    byPage.set(line.page, current);
  }

  return [...byPage.entries()]
    .sort((left, right) => left[0] - right[0])
    .flatMap(([, pageLines]) => {
      const sorted = [...pageLines].sort((left, right) =>
        right.y === left.y ? left.x - right.x : right.y - left.y,
      );
      const visualLines: RawPdfLine[][] = [];

      for (const line of sorted) {
        const currentLine = visualLines[visualLines.length - 1];
        if (!currentLine) {
          visualLines.push([line]);
          continue;
        }

        const referenceY = currentLine[0]?.y ?? line.y;
        if (Math.abs(referenceY - line.y) <= 2.5) {
          currentLine.push(line);
        } else {
          visualLines.push([line]);
        }
      }

      return visualLines
        .map((fragments) =>
          joinTextFragments(
            [...fragments]
              .sort((left, right) => left.x - right.x)
              .map((entry) => entry.text),
          ),
        )
        .filter(Boolean);
    });
}

export function splitImportedPdfSections(lines: string[]) {
  const sections: ImportedPdfSection[] = [];
  const prelude: string[] = [];
  let currentSection: ImportedPdfSection | null = null;

  for (const rawLine of lines) {
    const line = normalizeImportedLine(rawLine);
    if (!line) continue;

    const sectionType = resolveSectionType(line);
    if (sectionType !== "custom" && normalizeHeadingKey(line).length <= 32) {
      if (currentSection && currentSection.lines.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        heading: line.replace(/[：:]+$/, ""),
        lines: [],
      };
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(line);
    } else {
      prelude.push(line);
    }
  }

  if (currentSection && currentSection.lines.length > 0) {
    sections.push(currentSection);
  }

  return { prelude, sections };
}

export function buildResumeFromPdfLines(
  lines: string[],
  options: {
    existingDocument?: ResumeDocument;
    resumeId?: string;
  } = {},
) {
  const baseDocument =
    options.existingDocument ??
    createEmptyResumeDocument(options.resumeId ?? "default", "导入的 PDF 简历");
  const { prelude, sections } = splitImportedPdfSections(lines);
  const extracted = extractBasicsFromPrelude(prelude, baseDocument);
  const mappedSections = sections.map(buildPdfSection);

  if (mappedSections.length === 0 && extracted.remainingLines.length > 0) {
    mappedSections.push({
      id: createId("section"),
      type: "custom",
      title: "导入内容",
      visible: true,
      layout: "rich-text",
      contentHtml: textToHtml(extracted.remainingLines.join("\n")),
      items: [],
    });
  }

  const importedAt = nowIso();
  const pendingReview = [
    "请检查换行、项目符号和时间范围是否被正确识别。",
    "请核对导入后的内容顺序，确保最重要的经历仍排在前面。",
  ];
  const unmapped = ["PDF 中的视觉样式、双栏布局和字号层级不会被完整保留。"];

  if (sections.length === 0) {
    pendingReview.unshift("没有识别出标准章节标题，当前按原始阅读顺序导入。");
  }

  if (!extracted.basics.name.trim() || !extracted.basics.headline.trim()) {
    pendingReview.unshift("页眉信息未完整识别，请补全姓名、职位标题和联系方式。");
  }

  if (mappedSections.some((section) => section.type === "custom")) {
    unmapped.push("部分内容未识别为标准章节，已作为自定义内容导入。");
  }

  const fieldSuggestions = buildBasicsImportFieldSuggestions(baseDocument.basics, extracted.basics, "PDF 导入");

  return validateResumeDocument({
    ...baseDocument,
    basics: extracted.basics,
    meta: {
      ...baseDocument.meta,
      id: options.resumeId ?? baseDocument.meta.id,
      title: baseDocument.meta.title || "导入的 PDF 简历",
      updatedAt: importedAt,
    },
    sections: mappedSections.length > 0 ? mappedSections : baseDocument.sections,
    importTrace: {
      ...baseDocument.importTrace,
      portfolioImportedAt: baseDocument.importTrace.portfolioImportedAt,
      pdfImportedAt: importedAt,
      unmapped,
      pendingReview,
      snapshots: [],
      fieldSuggestions,
      reviewState: {
        completedTaskIds: [],
        reviewedPendingItems: [],
        reviewedSnapshotIds: [],
        reviewedFieldSuggestionIds: [],
      },
    },
  });
}

export async function importPdfToResume(
  buffer: Buffer,
  options: {
    existingDocument?: ResumeDocument;
    resumeId?: string;
  } = {},
) {
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  if (pdf.numPages > MAX_PDF_IMPORT_PAGES) {
    throw new Error(`PDF import supports up to ${MAX_PDF_IMPORT_PAGES} pages.`);
  }
  const rawLines: RawPdfLine[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      rawLines.push({
        page: pageNumber,
        text: item.str,
        x: item.transform[4] ?? 0,
        y: item.transform[5] ?? 0,
        fontName: item.fontName ?? "",
        fontSize: Number(item.height ?? 0),
      });
    }
  }

  const lines = groupPdfLines(rawLines);
  const document = buildResumeFromPdfLines(lines, options);

  return {
    document,
    rawPdf: {
      pageCount: pdf.numPages,
      lines: rawLines,
    },
  };
}
