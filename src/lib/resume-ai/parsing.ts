export function extractMessageText(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }

        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

export function cleanSummaryText(value: string) {
  return value
    .replace(/^摘要[:：]\s*/u, "")
    .replace(/^[\-\u2022]\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanBulletLines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/^[\-\u2022\d.\s]+/, "").trim())
    .filter(Boolean);
}

export function cleanTagLines(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,，、；]+/)
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

export function extractJsonObject(value: string) {
  const fencedMatch = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? value;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
