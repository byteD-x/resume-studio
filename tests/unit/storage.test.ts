import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const originalCwd = process.cwd();

async function loadStorageModule() {
  vi.resetModules();
  return import("@/lib/storage");
}

afterEach(async () => {
  process.chdir(originalCwd);
  vi.resetModules();
});

describe("storage management", () => {
  it("lists summaries for locally stored resumes", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-storage-"));
    process.chdir(tempDir);

    try {
      const storage = await loadStorageModule();
      const created = await storage.createResumeDocument("Product Resume", {
        writerProfile: "career-switch",
      });
      const original = {
        ...created,
        basics: {
          ...created.basics,
          name: "Original Name",
          headline: "Platform Engineer",
        },
        targeting: {
          ...created.targeting,
          role: "Platform Engineer",
          company: "Example Co",
        },
      };

      await storage.writeResumeDocument(original);
      await storage.writeResumeDocument({
        ...original,
        basics: {
          ...original.basics,
          name: "Changed Name",
        },
      });

      const summaries = await storage.listResumeSummaries();

      expect(summaries).toHaveLength(1);
      expect(summaries[0]?.meta.id).toBe(created.meta.id);
      expect(summaries[0]?.basics.name).toBe("Changed Name");
      expect(summaries[0]?.targeting.company).toBe("Example Co");
      expect(summaries[0]?.meta.writerProfile).toBe("career-switch");
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("duplicates and deletes resume folders", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-storage-"));
    process.chdir(tempDir);

    try {
      const storage = await loadStorageModule();
      const created = await storage.createResumeDocument("Targeted Resume");
      const duplicated = await storage.duplicateResumeDocument(created.meta.id);
      const summariesBeforeDelete = await storage.listResumeSummaries();

      await storage.deleteResumeDocument(created.meta.id);
      const summariesAfterDelete = await storage.listResumeSummaries();

      expect(duplicated.meta.id).not.toBe(created.meta.id);
      expect(duplicated.meta.title).toContain("Copy");
      expect(summariesBeforeDelete).toHaveLength(2);
      expect(summariesAfterDelete).toHaveLength(1);
      expect(summariesAfterDelete[0]?.meta.id).toBe(duplicated.meta.id);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
