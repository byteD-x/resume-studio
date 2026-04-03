import { spawn } from "node:child_process";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const DEFAULT_MAX_CACHE_MB = 512;
const DEFAULT_WARMUP_ROUTES = ["/login", "/", "/templates", "/resumes", "/import"];
const DEFAULT_WARMUP_CONCURRENCY = 3;
const ROUTE_WARMUP_ENABLED =
  process.env.NEXT_DEV_ROUTE_WARMUP === "1" && process.env.NEXT_DEV_SKIP_ROUTE_WARMUP !== "1";
const HOLD_OUTPUT_UNTIL_WARMUP = process.env.NEXT_DEV_HOLD_OUTPUT_UNTIL_WARMUP === "1";
const CACHE_PRUNE_THRESHOLD_MB = Number.parseInt(
  process.env.NEXT_DEV_CACHE_MAX_MB ?? `${DEFAULT_MAX_CACHE_MB}`,
  10,
);
const WARMUP_CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.NEXT_DEV_WARMUP_CONCURRENCY ?? `${DEFAULT_WARMUP_CONCURRENCY}`, 10) || DEFAULT_WARMUP_CONCURRENCY,
);
const WARMUP_TIMEOUT_MS = Number.parseInt(process.env.NEXT_DEV_WARMUP_TIMEOUT_MS ?? "20000", 10);

async function getDirectorySizeUntilLimit(rootDir, limitBytes) {
  let total = 0;
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      total += await stat(fullPath).then((file) => file.size, () => 0);

      if (total > limitBytes) {
        return total;
      }
    }
  }

  return total;
}

async function pruneOversizedDevCache() {
  if (process.env.NEXT_DEV_SKIP_CACHE_PRUNE === "1") {
    return;
  }

  if (!Number.isFinite(CACHE_PRUNE_THRESHOLD_MB) || CACHE_PRUNE_THRESHOLD_MB < 0) {
    return;
  }

  const devDir = path.join(process.cwd(), ".next", "dev");
  const turbopackCacheDir = path.join(devDir, "cache", "turbopack");
  const limitBytes = CACHE_PRUNE_THRESHOLD_MB * 1024 * 1024;
  const cacheBytes = await getDirectorySizeUntilLimit(turbopackCacheDir, limitBytes);

  if (cacheBytes <= limitBytes) {
    return;
  }

  await rm(devDir, { recursive: true, force: true });
  const cacheMb = (cacheBytes / 1024 / 1024).toFixed(1);
  console.log(
    `[dev] Removed oversized Next dev cache (${cacheMb} MB > ${CACHE_PRUNE_THRESHOLD_MB} MB) from ${path.relative(process.cwd(), devDir)}.`,
  );
}

function resolveStorageRoot() {
  const configuredRoot = process.env.RESUME_STUDIO_DATA_DIR?.trim();
  if (configuredRoot) {
    return path.isAbsolute(configuredRoot)
      ? configuredRoot
      : path.join(process.cwd(), configuredRoot);
  }

  return path.join(process.cwd(), "data", "resumes");
}

async function readLatestResumeId() {
  const legacyRoot = resolveStorageRoot();
  const userRoot = path.join(path.dirname(legacyRoot), "users");
  /** @type {Array<string>} */
  const documentPaths = [];

  try {
    const entries = await readdir(legacyRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        documentPaths.push(path.join(legacyRoot, entry.name, "document.json"));
      }
    }
  } catch {
    // ignore legacy root misses
  }

  try {
    const users = await readdir(userRoot, { withFileTypes: true });
    for (const user of users) {
      if (!user.isDirectory()) {
        continue;
      }

      const resumesRoot = path.join(userRoot, user.name, "resumes");
      let resumes;

      try {
        resumes = await readdir(resumesRoot, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const resume of resumes) {
        if (resume.isDirectory()) {
          documentPaths.push(path.join(resumesRoot, resume.name, "document.json"));
        }
      }
    }
  } catch {
    // ignore missing user root
  }

  const documents = await Promise.all(
    documentPaths.map(async (documentPath) => {
      try {
        const raw = await readFile(documentPath, "utf8");
        const parsed = JSON.parse(raw);
        const id = typeof parsed?.meta?.id === "string" ? parsed.meta.id : path.basename(path.dirname(documentPath));
        const updatedAt =
          typeof parsed?.meta?.updatedAt === "string" ? parsed.meta.updatedAt : "";

        return { id, updatedAt };
      } catch {
        return null;
      }
    }),
  );

  const latest = documents
    .filter((document) => document?.id)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

  return latest?.id ?? null;
}

function resolveRequestedBaseUrl(args) {
  const portIndex = args.findIndex((arg) => arg === "--port" || arg === "-p");
  if (portIndex >= 0) {
    const port = args[portIndex + 1];
    if (port) {
      return `http://localhost:${port}`;
    }
  }

  return "http://localhost:3000";
}

async function warmRoute(baseUrl, route) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}${route}`, {
      headers: { "x-resume-studio-dev-warmup": "1" },
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startedAt;
    console.log(`[dev] Warmed ${route} (${response.status}) in ${elapsedMs}ms.`);
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[dev] Warmup skipped for ${route} after ${elapsedMs}ms: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function warmCriticalRoutes(baseUrl) {
  if (!ROUTE_WARMUP_ENABLED) {
    return;
  }

  const routes = [...DEFAULT_WARMUP_ROUTES];
  const latestResumeId = await readLatestResumeId();

  if (latestResumeId) {
    routes.push(`/studio/${latestResumeId}`, `/studio/${latestResumeId}/preview`);
  }

  const dedupedRoutes = [...new Set(routes)];
  console.log(
    `[dev] Warming ${dedupedRoutes.length} critical routes from ${baseUrl} with concurrency ${WARMUP_CONCURRENCY}.`,
  );

  if (dedupedRoutes.length === 0) {
    return;
  }

  await warmRoute(baseUrl, dedupedRoutes[0]);

  for (let index = 1; index < dedupedRoutes.length; index += WARMUP_CONCURRENCY) {
    const batch = dedupedRoutes.slice(index, index + WARMUP_CONCURRENCY);
    await Promise.allSettled(batch.map(async (route) => warmRoute(baseUrl, route)));
  }
}

async function main() {
  await pruneOversizedDevCache();

  const nextBin = require.resolve("next/dist/bin/next");
  const fallbackBaseUrl = resolveRequestedBaseUrl(process.argv.slice(2));
  const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  let outputBuffer = "";
  let localBaseUrl = fallbackBaseUrl;
  let warmupStarted = false;
  let startupOutputReleased = !HOLD_OUTPUT_UNTIL_WARMUP;
  /** @type {Array<{ target: NodeJS.WriteStream; text: string }>} */
  const startupOutputQueue = [];

  const releaseStartupOutput = () => {
    if (startupOutputReleased) {
      return;
    }

    startupOutputReleased = true;

    for (const entry of startupOutputQueue) {
      entry.target.write(entry.text);
    }

    startupOutputQueue.length = 0;
  };

  const handleOutput = (chunk, target) => {
    const text = chunk.toString();
    outputBuffer = `${outputBuffer}${text}`.slice(-12000);

    if (startupOutputReleased) {
      target.write(text);
    } else {
      startupOutputQueue.push({ target, text });
    }

    const localMatch = outputBuffer.match(/Local:\s+(https?:\/\/[^\s]+)/);
    if (localMatch?.[1]) {
      localBaseUrl = localMatch[1];
    }

    if (!warmupStarted && /Ready in\s+\d+/u.test(outputBuffer)) {
      warmupStarted = true;
      setTimeout(() => {
        void warmCriticalRoutes(localBaseUrl).finally(() => {
          releaseStartupOutput();
        });
      }, 250);
    }
  };

  child.stdout?.on("data", (chunk) => handleOutput(chunk, process.stdout));
  child.stderr?.on("data", (chunk) => handleOutput(chunk, process.stderr));

  child.on("exit", (code, signal) => {
    releaseStartupOutput();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error("[dev] Failed to start Next.js dev server.", error);
  process.exit(1);
});
