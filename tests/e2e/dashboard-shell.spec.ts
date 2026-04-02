import { expect, test } from "./fixtures/auth";

test("dashboard renders the workspace entry points", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("main").getByText("Resume Studio")).toBeVisible();
  await expect(page.locator('a[href="/templates"]').first()).toBeVisible();
  await expect(page.locator('a[href="/resumes"]').first()).toBeVisible();
});

test("resumes library renders for the authenticated workspace", async ({ page }) => {
  await page.goto("/resumes");

  await expect(page).toHaveURL(/\/resumes$/);
  await expect(page.getByRole("heading", { name: "简历库" })).toBeVisible();
  await expect(page.locator('a[href="/templates"]').first()).toBeVisible();
});

test("templates page renders template cards and import entry", async ({ page }) => {
  await page.goto("/templates");

  await expect(page.getByRole("heading", { name: "新建简历" })).toBeVisible();
  await expect(page.locator("main article").first()).toBeVisible();
  await expect(page.locator('a[href="/import"]').first()).toBeVisible();
});

test("template starter resumes keep onboarding guidance in the editor", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: {
      title: `Template Starter ${Date.now()}`,
      starter: "template",
      template: "aurora-grid",
    },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}?onboarding=template&focus=basics`);

    await expect(page.locator(".editor-toolbar-titleinput")).toBeVisible();
    await expect(page.locator(".editor-toolbar-message")).toContainText("模板");
    await expect(page.locator(".editor-workbench-header")).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("import workspace brings pasted text into the editor review flow", async ({ page, request }) => {
  let createdId: string | null = null;

  try {
    await page.goto("/import?tab=text");
    await page.locator("textarea").first().fill(
      [
        "Jane Doe",
        "Frontend Engineer",
        "Built growth surfaces and project pages.",
        "Project",
        "Resume Studio",
        "Built a structured resume editor.",
      ].join("\n"),
    );

    await page.getByRole("button", { name: "提取内容" }).click();
    await expect(page.getByText("基础信息已提取")).toBeVisible();
    await page.getByRole("button", { name: "进入内容打磨" }).click();

    await page.waitForURL(/\/studio\/[^/?]+\?onboarding=portfolio&focus=content/);
    createdId = page.url().match(/\/studio\/([^/?]+)/)?.[1] ?? null;

    await expect(page.locator(".editor-compact-alert").nth(1)).toBeVisible();
    await expect(page.getByRole("button", { name: "去核对" }).first()).toBeVisible();
    await expect(page.locator(".editor-toolbar-titleinput")).toHaveValue(/Jane Doe/);
  } finally {
    if (createdId) {
      await request.delete(`/api/resumes/${createdId}`);
    }
  }
});

test("studio renders the current editor shell and preview workspace", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Editor Shell ${Date.now()}`, starter: "guided" },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}`);

    await expect(page.locator(".editor-toolbar-titleinput")).toBeVisible();
    await expect(page.getByRole("button", { name: "可视化", pressed: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Markdown", exact: true })).toBeVisible();
    await expect(page.locator(".editor-workbench-header")).toBeVisible();
    await expect(page.locator(".editor-preview-panel")).toBeVisible();
    await expect(page.getByRole("button", { name: "预览 / 导出" }).first()).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("preview page shows export checks for incomplete drafts", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Preview Checklist ${Date.now()}` },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}/preview`);

    await expect(page.getByRole("button", { name: "导出 PDF" })).toBeDisabled();
    await expect(page.getByText("导出前检查")).toBeVisible();
    await expect(page.getByText("待补齐").first()).toBeVisible();
    await expect(page.getByText("导出概览")).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});
