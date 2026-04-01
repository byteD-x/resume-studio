export function sanitizeCustomCss(value: string) {
  return value
    .replace(/<\/style/gi, "<\\/style")
    .replace(/@import/gi, "")
    .replace(/url\s*\(/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/behavior\s*:/gi, "")
    .replace(/-moz-binding/gi, "")
    .replace(/javascript:/gi, "");
}
