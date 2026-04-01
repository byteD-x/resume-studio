import type { ResumeSection } from "@/types/resume";
import { headingSectionMap } from "./shared";

export function normalizeImportedLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeHeadingKey(value: string) {
  return normalizeImportedLine(value)
    .replace(/[：:]+$/, "")
    .toLowerCase();
}

export function joinTextFragments(fragments: string[]) {
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

export function resolveSectionType(heading: string) {
  const normalized = normalizeHeadingKey(heading);
  return headingSectionMap.get(normalized) ?? "custom";
}

export function buildSectionTitle(heading: string, type: ResumeSection["type"]) {
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

export function splitSkillTags(lines: string[]) {
  return Array.from(
    new Set(
      lines
        .flatMap((line) => line.split(/[\n,，、•·|/]/))
        .map((entry) => normalizeImportedLine(entry))
        .filter((entry) => entry.length > 0 && entry.length <= 48),
    ),
  );
}

export function isBulletLine(line: string) {
  return /^[-*•▪◦]\s+/.test(line);
}

export function cleanBulletLine(line: string) {
  return normalizeImportedLine(line.replace(/^[-*•▪◦]\s+/, ""));
}

export function extractDateRangeValue(line: string) {
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

export function hasCjkCharacters(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

export function hasLatinCharacters(value: string) {
  return /[A-Za-z]/.test(value);
}

export function isMostlyCjkPhrase(value: string) {
  return hasCjkCharacters(value) && !hasLatinCharacters(value);
}

export function isMostlyLatinPhrase(value: string) {
  return hasLatinCharacters(value) && !hasCjkCharacters(value);
}

export function areLikelyBilingualVariants(left: string, right: string) {
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

export function areSeparatedBilingualPhrases(left: string, right: string) {
  return (
    left.length > 0
    && right.length > 0
    && (
      (isMostlyLatinPhrase(left) && isMostlyCjkPhrase(right))
      || (isMostlyCjkPhrase(left) && isMostlyLatinPhrase(right))
    )
  );
}

export function looksLikeRoleSegment(value: string) {
  return /\b(engineer|developer|designer|manager|lead|intern|consultant|architect|analyst|specialist|director|scientist|researcher)\b/i
    .test(value)
    || /(工程师|开发|设计师|经理|负责人|实习|顾问|架构师|产品|运营|分析师|研究员|主管|总监)/.test(value);
}

export function looksLikeOrganizationSegment(value: string) {
  return /\b(inc|llc|ltd|corp|corporation|company|group|studio|labs|lab|systems|technologies|technology|tech|software|network|digital|media|partners|ventures|university|college)\b/i
    .test(value)
    || /(公司|集团|科技|网络|信息|大学|学院|银行|医院|研究院|实验室|中心|工作室)/.test(value);
}

export function looksLikeEducationInstitutionSegment(value: string) {
  return /\b(university|college|school|academy|institute|polytechnic)\b/i.test(value)
    || /(大学|学院|学校|中学|研究院|研究所)/.test(value);
}

export function looksLikeEducationDegreeSegment(value: string) {
  return /\b(bachelor|master|phd|doctor|mba|bsc|msc|ba|ma|bs|ms|associate|diploma)\b/i.test(value)
    || /(本科|硕士|博士|学士|专科|大专|研究生|高中|中专|学历)/.test(value);
}

export function looksLikeLocationSegment(value: string) {
  return /\b(remote|hybrid|onsite|on-site|beijing|shanghai|shenzhen|guangzhou|hangzhou|nanjing|wuhan|chengdu|xian|suzhou|tianjin|chongqing|hong kong|singapore|tokyo|seoul|london|new york|san francisco|los angeles|boston)\b/i
    .test(value)
    || /(北京|上海|深圳|广州|杭州|南京|武汉|成都|西安|苏州|天津|重庆|香港|澳门|新加坡|东京|伦敦|纽约|远程|混合办公|现场)/.test(value);
}

export function isPureLocationValue(value: string) {
  return looksLikeLocationSegment(value)
    && !looksLikeRoleSegment(value)
    && !looksLikeOrganizationSegment(value)
    && !looksLikeEducationInstitutionSegment(value)
    && !looksLikeEducationDegreeSegment(value);
}

export function mergeBilingualHeaderSegments(segments: string[]) {
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

export function mergeBilingualEducationDescriptorSegments(segments: string[]) {
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

export function looksLikeMetaLine(line: string) {
  return (
    line.includes("·")
    || line.includes("|")
    || line.includes("•")
    || !!extractDateRangeValue(line)
  );
}

export function isStandaloneMetaLine(line: string) {
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
