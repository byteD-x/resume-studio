import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
const originalDataDir = process.env.RESUME_STUDIO_DATA_DIR;

async function loadModules() {
  vi.resetModules();
  const storage = await import("@/lib/storage");
  const route = await import("@/app/api/resumes/[id]/route");
  return { storage, route };
}

function createDeleteRequest(url: string) {
  return new NextRequest(url, { method: "DELETE" });
}

afterEach(async () => {
  process.chdir(originalCwd);
  if (originalDataDir === undefined) {
    delete process.env.RESUME_STUDIO_DATA_DIR;
  } else {
    process.env.RESUME_STUDIO_DATA_DIR = originalDataDir;
  }
  vi.resetModules();
});

describe("resume delete route", () => {
  it("deletes a standalone draft without affecting others", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-delete-route-"));
    process.chdir(tempDir);

    try {
      const { storage, route } = await loadModules();
      const first = await storage.createResumeDocument("Standalone One");
      const second = await storage.createResumeDocument("Standalone Two");

      const response = await route.DELETE(
        createDeleteRequest(`http://localhost/api/resumes/${first.meta.id}`),
        { params: Promise.resolve({ id: first.meta.id }) },
      );

      const summaries = await storage.listResumeSummaries();
      expect(response.status).toBe(204);
      expect(summaries).toHaveLength(1);
      expect(summaries[0]?.meta.id).toBe(second.meta.id);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("deletes a source draft together with its lineage group when scope=lineage", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-delete-route-"));
    process.chdir(tempDir);

    try {
      const { storage, route } = await loadModules();
      const source = await storage.createResumeDocument("Lineage Source");
      const variant = await storage.writeResumeDocument({
        ...source,
        meta: {
          ...source.meta,
          id: "lineage-source-variant",
          title: "Lineage Variant",
          sourceRefs: Array.from(new Set([...source.meta.sourceRefs, `resume:${source.meta.id}`])),
        },
      });

      const response = await route.DELETE(
        createDeleteRequest(`http://localhost/api/resumes/${source.meta.id}?scope=lineage`),
        { params: Promise.resolve({ id: source.meta.id }) },
      );

      const summaries = await storage.listResumeSummaries();
      expect(response.status).toBe(204);
      expect(variant.meta.id).toBe("lineage-source-variant");
      expect(summaries).toHaveLength(0);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("deletes only the variant when deleting a tailored draft", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-delete-route-"));
    process.chdir(tempDir);

    try {
      const { storage, route } = await loadModules();
      const source = await storage.createResumeDocument("Source Draft");
      const variant = await storage.writeResumeDocument({
        ...source,
        meta: {
          ...source.meta,
          id: "source-draft-variant",
          title: "Variant Draft",
          sourceRefs: Array.from(new Set([...source.meta.sourceRefs, `resume:${source.meta.id}`])),
        },
      });

      const response = await route.DELETE(
        createDeleteRequest(`http://localhost/api/resumes/${variant.meta.id}`),
        { params: Promise.resolve({ id: variant.meta.id }) },
      );

      const summaries = await storage.listResumeSummaries();
      expect(response.status).toBe(204);
      expect(summaries).toHaveLength(1);
      expect(summaries[0]?.meta.id).toBe(source.meta.id);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
