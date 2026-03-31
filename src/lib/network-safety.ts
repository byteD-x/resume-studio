const DEFAULT_TRUSTED_AI_HOSTS = [
  "api.groq.com",
  "openrouter.ai",
  "api.siliconflow.cn",
  "api.cerebras.ai",
  "api.sambanova.ai",
  "dashscope-intl.aliyuncs.com",
] as const;

function getEnvList(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isTruthyEnv(name: string) {
  return /^(1|true|yes)$/i.test(process.env[name] ?? "");
}

function isLoopbackHostname(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "::1" || normalized === "127.0.0.1";
}

function isPrivateIpv4(hostname: string) {
  const segments = hostname.split(".").map((value) => Number(value));
  if (segments.length !== 4 || segments.some((value) => Number.isNaN(value))) {
    return false;
  }

  const [first, second] = segments;
  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

export function isPrivateHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) return true;
  if (isLoopbackHostname(normalized)) return true;
  if (normalized.endsWith(".local")) return true;

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalized)) {
    return isPrivateIpv4(normalized);
  }

  if (normalized.includes(":")) {
    return isPrivateIpv6(normalized);
  }

  return false;
}

function parseHttpUrl(input: string, label: string) {
  let parsed: URL;

  try {
    parsed = new URL(input);
  } catch {
    throw new Error(`${label} must be a valid http(s) URL.`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${label} must use http or https.`);
  }

  if (parsed.username || parsed.password) {
    throw new Error(`${label} cannot contain embedded credentials.`);
  }

  return parsed;
}

export function assertSafeUrlImportTarget(input: string) {
  const parsed = parseHttpUrl(input, "Import URL");

  if (isPrivateHostname(parsed.hostname) && !isTruthyEnv("RESUME_STUDIO_ALLOW_PRIVATE_URL_IMPORTS")) {
    throw new Error("Import URL must point to a public http(s) host.");
  }

  return parsed;
}

export function assertSafeAiBaseUrl(input: string) {
  const parsed = parseHttpUrl(input, "AI Base URL");
  const hostname = parsed.hostname.toLowerCase();
  const trustedHosts = new Set([
    ...DEFAULT_TRUSTED_AI_HOSTS,
    ...getEnvList("RESUME_STUDIO_ALLOWED_AI_HOSTS"),
  ]);
  const localAllowed =
    process.env.NODE_ENV !== "production" || isTruthyEnv("RESUME_STUDIO_ALLOW_PRIVATE_AI_HOSTS");

  if (isPrivateHostname(hostname)) {
    if (!localAllowed) {
      throw new Error(
        "Local or private-network AI endpoints are disabled in production. Set RESUME_STUDIO_ALLOW_PRIVATE_AI_HOSTS=true only when you trust the deployment environment.",
      );
    }

    return parsed;
  }

  const trusted = [...trustedHosts].some(
    (candidate) => hostname === candidate || hostname.endsWith(`.${candidate}`),
  );

  if (!trusted) {
    throw new Error(
      "AI Base URL is not in the trusted host allowlist. Configure RESUME_STUDIO_ALLOWED_AI_HOSTS to permit additional providers.",
    );
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Public AI Base URL must use https.");
  }

  return parsed;
}
