import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createEmptyResumeDocument } from "@/lib/resume-document";

const originalCwd = process.cwd();
const originalDataDir = process.env.RESUME_STUDIO_DATA_DIR;

async function loadStorageModule() {
  vi.resetModules();
  return import("@/lib/storage");
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
      expect(duplicated.meta.title).toContain("副本");
      expect(summariesBeforeDelete).toHaveLength(2);
      expect(summariesAfterDelete).toHaveLength(1);
      expect(summariesAfterDelete[0]?.meta.id).toBe(duplicated.meta.id);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("creates guided starters when requested", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-storage-"));
    process.chdir(tempDir);

    try {
      const storage = await loadStorageModule();
      const created = await storage.createResumeDocument("Guided Resume", {
        starter: "guided",
        writerProfile: "campus",
        template: "portfolio-brief",
      });

      expect(created.meta.sourceRefs).toContain("starter:guided");
      expect(created.meta.writerProfile).toBe("campus");
      expect(created.meta.template).toBe("portfolio-brief");
      expect(created.layout.headingFont).toBe("Times New Roman");
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("creates template starter resumes with seeded content", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-storage-"));
    process.chdir(tempDir);

    try {
      const storage = await loadStorageModule();
      const created = await storage.createResumeDocument("Template Resume", {
        starter: "template-sample",
        writerProfile: "experienced",
        template: "engineer-pro",
      });

      expect(created.meta.template).toBe("engineer-pro");
      expect(created.meta.sourceRefs).toContain("starter:template-sample");
      expect(created.basics.name).not.toBe("");
      expect(created.sections.some((section) => section.items.length > 0)).toBe(true);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("keeps distinct unicode resume ids in separate folders", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-storage-"));
    process.chdir(tempDir);

    try {
      const storage = await loadStorageModule();
      await storage.writeResumeDocument(createEmptyResumeDocument("张三", "张三简历"));
      await storage.writeResumeDocument(createEmptyResumeDocument("李四", "李四简历"));

      const zhang = await storage.readResumeDocument("张三");
      const li = await storage.readResumeDocument("李四");
      const summaries = await storage.listResumeSummaries();

      expect(zhang.meta.id).toBe("张三");
      expect(li.meta.id).toBe("李四");
      expect(summaries).toHaveLength(2);
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("supports overriding the storage root with RESUME_STUDIO_DATA_DIR", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "resume-studio-storage-"));
    process.chdir(tempDir);
    process.env.RESUME_STUDIO_DATA_DIR = ".tmp/test-resumes";

    try {
      const storage = await loadStorageModule();
      const created = await storage.createResumeDocument("Isolated Resume");
      const expectedDocumentPath = path.join(tempDir, ".tmp", "test-resumes", created.meta.id, "document.json");

      expect(storage.getStorageRoot()).toBe(path.join(tempDir, ".tmp", "test-resumes"));
      await expect(import("node:fs/promises").then(({ access }) => access(expectedDocumentPath))).resolves.toBeUndefined();
    } finally {
      process.chdir(originalCwd);
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
