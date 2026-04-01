import { expect, test } from "@playwright/test";

test("dashboard renders the current resume library entry surface", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "简历库" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "新建简历" })).toBeVisible();
});

test("resumes library stays accessible without auth", async ({ page }) => {
  await page.goto("/resumes");
  await expect(page).toHaveURL(/\/resumes$/);
  await expect(page.getByRole("heading", { name: "简历库" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "新建简历" })).toBeVisible();
});

test("templates page explains the current writer profile and creation flow", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: "新建简历" })).toBeVisible();
  await expect(page.getByRole("button", { name: "有经验求职" })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择此排版" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "解析源文件或导入线上经历" })).toBeVisible();
});

test("template starter resumes show editor onboarding flow", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: {
      title: `Template Starter ${Date.now()}`,
      starter: "template-sample",
      template: "aurora-grid",
    },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}?onboarding=template&focus=basics`);
    await expect(page.locator(".resume-editor-onboarding")).toBeVisible();
    await expect(page.getByText("先把模板示例改成你的真实经历")).toBeVisible();
    await expect(page.getByRole("button", { name: "先改基础信息" })).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("import workspace can bring text content into the editor review flow", async ({ page, request }) => {
  let createdId: string | null = null;

  try {
    await page.goto("/import?tab=text");
    await page.getByRole("textbox").fill(
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

    await expect(page.locator(".resume-editor-import-banner")).toBeVisible();
    await expect(page.getByRole("button", { name: "核对基础信息" })).toBeVisible();
    await expect(page.getByRole("button", { name: "核对内容" })).toBeVisible();
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
    await expect(page.getByRole("button", { name: "表单", pressed: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Markdown", exact: true })).toBeVisible();
    await expect(page.locator(".editor-workbench-header")).toBeVisible();
    await expect(page.locator(".editor-preview-panel")).toBeVisible();
    await expect(page.getByRole("button", { name: "导出预览" }).first()).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("preview page shows export checklist for incomplete drafts", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Preview Checklist ${Date.now()}` },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}/preview`);
    await expect(page.getByText("需要补充内容")).toBeVisible();
    await expect(page.getByText("最终决策")).toBeVisible();
    await expect(page.getByText("导出前检查")).toBeVisible();
    await expect(page.getByText("必须处理").first()).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});
