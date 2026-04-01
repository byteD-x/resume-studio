import type { ResumeSection } from "@/types/resume";
import {
  areLikelyBilingualVariants,
  areSeparatedBilingualPhrases,
  extractDateRangeValue,
  hasLatinCharacters,
  isBulletLine,
  isPureLocationValue,
  isStandaloneMetaLine,
  looksLikeEducationDegreeSegment,
  looksLikeEducationInstitutionSegment,
  looksLikeLocationSegment,
  looksLikeMetaLine,
  looksLikeOrganizationSegment,
  looksLikeRoleSegment,
  mergeBilingualEducationDescriptorSegments,
  mergeBilingualHeaderSegments,
  normalizeImportedLine,
  resolveSectionType,
} from "./text-helpers";

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

export function splitStructuredEntryBlocks(lines: string[]) {
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

export function parseMetaLine(line: string) {
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

export function parseRoleOrganizationPair(line: string) {
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

export function isRoleOnlyLine(line: string) {
  const normalized = normalizeImportedLine(line);
  return (
    !!normalized
    && looksLikeRoleSegment(normalized)
    && !looksLikeMetaLine(normalized)
    && !looksLikeOrganizationSegment(normalized)
    && !looksLikeLocationSegment(normalized)
  );
}

export function isOrganizationOnlyLine(line: string) {
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

export function normalizeStructuredHeaderBlock(lines: string[], type: ResumeSection["type"]) {
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

export function parseLooseEntryHeaderLine(line: string) {
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

export function parseEntryHeaderLine(line: string) {
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

export function parseEducationHeaderLine(line: string) {
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

export function looksLikeInlineEntryHeader(line: string) {
  const parsed = parseEntryHeaderLine(line);
  if (!parsed.parsed) return false;

  return (
    !!parsed.dateRange
    || !!parsed.location
    || looksLikeRoleSegment(parsed.subtitle)
  );
}
