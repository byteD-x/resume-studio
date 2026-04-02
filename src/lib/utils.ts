import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

export function slugify(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "resume";
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeRichTextHtml(value: string) {
  const withSafeInlineStyles = value.replace(
    /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi,
    (_match, _quoted, doubleQuoted, singleQuoted) => {
      const source = typeof doubleQuoted === "string" ? doubleQuoted : (singleQuoted ?? "");
      const safeStyle = source
        .split(";")
        .map((part: string) => part.trim())
        .filter(Boolean)
        .map((part: string) => {
          const [property, ...rest] = part.split(":");
          if (!property || rest.length === 0) return null;
          const key = property.trim().toLowerCase();
          const rawValue = rest.join(":").trim();
          if (!rawValue) return null;

          if (key === "color" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(rawValue)) {
            return `color: ${rawValue}`;
          }

          if (key === "font-size" && /^(?:\d+(?:\.\d+)?)(?:px|pt|em|rem|%)$/i.test(rawValue)) {
            return `font-size: ${rawValue}`;
          }

          if (
            key === "font-family" &&
            /^[\w\s"',.-]+$/i.test(rawValue)
          ) {
            return `font-family: ${rawValue}`;
          }

          if (key === "font-weight" && /^(?:normal|bold|[1-9]00)$/i.test(rawValue)) {
            return `font-weight: ${rawValue}`;
          }

          if (key === "font-style" && /^(?:normal|italic)$/i.test(rawValue)) {
            return `font-style: ${rawValue}`;
          }

          if (key === "text-decoration" && /^(?:none|underline)$/i.test(rawValue)) {
            return `text-decoration: ${rawValue}`;
          }

          if (key === "text-align" && /^(?:left|center|right)$/i.test(rawValue)) {
            return `text-align: ${rawValue}`;
          }

          return null;
        })
        .filter(Boolean)
        .join("; ");

      return safeStyle ? ` style="${safeStyle}"` : "";
    },
  );

  return withSafeInlineStyles
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(?:iframe|object|embed|link|meta|base|form|input|button|textarea|select|option|svg|math)[^>]*>/gi, "")
    .replace(/\son[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(?:"\s*(?:javascript|data):[^"]*"|'\s*(?:javascript|data):[^']*'|(?:javascript|data):[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");
}

function resolveUrlCandidate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^[a-z][a-z\d+\-.]*:/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (/^[\w.-]+\.[a-z]{2,}(?:[/?#]|$)/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return null;
}

export function sanitizeHref(value: string) {
  const candidate = resolveUrlCandidate(value);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    if (["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

export function sanitizeImageSrc(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (/^data:image\/(?:png|jpe?g|gif|webp|bmp);base64,[a-z0-9+/=\s]+$/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, "");
  }

  const candidate = resolveUrlCandidate(trimmed);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    if (["http:", "https:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

export function textToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((chunk) => `<p>${escapeHtml(chunk).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
