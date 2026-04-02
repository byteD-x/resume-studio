import path from "node:path";
import { slugify } from "@/lib/utils";

const PROJECT_ROOT = process.cwd();
const DEFAULT_DATA_ROOT = path.join(PROJECT_ROOT, "data");
const DEFAULT_LEGACY_RESUME_STORAGE_ROOT = path.join(DEFAULT_DATA_ROOT, "resumes");

function resolveConfiguredResumeStorageRoot() {
  const configuredRoot = process.env.RESUME_STUDIO_DATA_DIR?.trim();

  if (!configuredRoot) {
    return DEFAULT_LEGACY_RESUME_STORAGE_ROOT;
  }

  if (path.isAbsolute(configuredRoot)) {
    return configuredRoot;
  }

  if (process.env.NODE_ENV !== "production") {
    return path.join(/* turbopackIgnore: true */ PROJECT_ROOT, configuredRoot);
  }

  return DEFAULT_LEGACY_RESUME_STORAGE_ROOT;
}

export function resolveDataRoot() {
  const configuredRoot = process.env.RESUME_STUDIO_DATA_DIR?.trim();

  if (!configuredRoot) {
    return DEFAULT_DATA_ROOT;
  }

  const absoluteRoot = path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.join(/* turbopackIgnore: true */ PROJECT_ROOT, configuredRoot);

  return path.dirname(absoluteRoot);
}

export function resolveLegacyResumeStorageRoot() {
  return resolveConfiguredResumeStorageRoot();
}

export function resolveAuthStorageRoot() {
  return path.join(resolveDataRoot(), "auth");
}

export function resolveUserWorkspaceRoot(userId: string) {
  return path.join(resolveDataRoot(), "users", slugify(userId));
}

export function resolveUserResumeStorageRoot(userId: string) {
  return path.join(resolveUserWorkspaceRoot(userId), "resumes");
}
