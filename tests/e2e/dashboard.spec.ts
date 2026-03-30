import { expect, test } from "@playwright/test";

test("dashboard renders primary entry point", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /简历工作台/,
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /选一个模板开始/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /继续当前草稿/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /导入旧内容，完成后导出/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /从模板开始/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /导入旧 pdf/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /我的简历/ }).first()).toBeVisible();
  await expect(page.getByText(/设置身份/)).toHaveCount(0);
});

test("resumes library stays accessible without auth", async ({ page }) => {
  await page.goto("/resumes");
  await expect(page).toHaveURL(/\/resumes$/);
  await expect(page.getByRole("heading", { name: /我的简历/ })).toBeVisible();
});

test("templates page explains the current writer profile", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: /选择模板开始/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /有经验求职/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /用这个模板开始/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /导入旧 pdf/i })).toBeVisible();
});

test("studio renders current editor shell and preview panel", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Editor Shell ${Date.now()}`, starter: "guided" },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}`);
    await expect(page.locator(".editor-toolbar-titleinput")).toBeVisible();
    await expect(page.getByRole("tab", { name: /表单/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /markdown/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "基本信息" })).toBeVisible();
    await expect(page.getByRole("button", { name: "岗位信息" })).toBeVisible();
    await expect(page.locator(".editor-preview-head")).toContainText("预览");
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
    await expect(page.getByText(/需要补充内容/)).toBeVisible();
    await expect(page.getByText(/导出前检查/)).toBeVisible();
    await expect(page.locator(".preview-sidebar-card").getByText("姓名和职位", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/必须处理/).first()).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("studio auto-saves edits and keeps them after reload", async ({ page, request }) => {
  const createdTitle = `Autosave Draft ${Date.now()}`;
  const nextTitle = `Autosave Smoke ${Date.now()}`;
  const createdResponse = await request.post("/api/resumes", {
    data: { title: createdTitle },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}`);

    const titleField = page.locator(".editor-toolbar-titleinput");
    await titleField.fill(nextTitle);

    await expect(page.locator(".editor-toolbar-hint")).toContainText(/已自动保存|已保存/, { timeout: 5000 });
    await page.reload();
    await expect(titleField).toHaveValue(nextTitle);
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("studio carries targeting edits into preview flow", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Tailor Source ${Date.now()}` },
  });
  const created = await createdResponse.json();

  try {
    await request.put(`/api/resumes/${created.meta.id}`, {
      data: {
        ...created,
        meta: {
          ...created.meta,
          title: "Tailor Source",
        },
        targeting: {
          ...created.targeting,
          role: "Staff Frontend Engineer",
          company: "Acme",
          focusKeywords: ["React", "Next.js", "Design Systems"],
        },
        sections: [
          {
            id: "experience",
            type: "experience",
            title: "Experience",
            visible: true,
            layout: "stacked-list",
            contentHtml: "",
            items: [
              {
                id: "exp-1",
                title: "React Platform Lead",
                subtitle: "",
                location: "",
                dateRange: "2024-2026",
                meta: "",
                summaryHtml: "<p>Owned a Next.js migration across shared frontend surfaces.</p>",
                bulletPoints: ["Built a reusable design systems layer."],
                tags: ["React", "Next.js"],
              },
            ],
          },
          {
            id: "projects",
            type: "projects",
            title: "Projects",
            visible: true,
            layout: "stacked-list",
            contentHtml: "",
            items: [
              {
                id: "proj-1",
                title: "Design System Refresh",
                subtitle: "",
                location: "",
                dateRange: "2025",
                meta: "",
                summaryHtml: "<p>Standardized tokens and component contracts.</p>",
                bulletPoints: [],
                tags: ["Design Systems"],
              },
              {
                id: "proj-2",
                title: "Experimentation Console",
                subtitle: "",
                location: "",
                dateRange: "2025",
                meta: "",
                summaryHtml: "<p>Expanded rollout tooling for React teams.</p>",
                bulletPoints: [],
                tags: ["React"],
              },
            ],
          },
          {
            id: "custom",
            type: "custom",
            title: "Operations",
            visible: true,
            layout: "stacked-list",
            contentHtml: "",
            items: [
              {
                id: "ops-1",
                title: "Office Move Support",
                subtitle: "",
                location: "",
                dateRange: "2023",
                meta: "",
                summaryHtml: "<p>Managed seating and hardware logistics.</p>",
                bulletPoints: [],
                tags: ["Operations"],
              },
            ],
          },
        ],
      },
    });

    await page.goto(`/studio/${created.meta.id}`);
    await page.getByRole("button", { name: /岗位信息/ }).click();
    await expect(page.getByRole("heading", { name: /岗位信息/ })).toBeVisible();

    await page.getByLabel("岗位").fill("Staff Frontend Engineer");
    await page.getByLabel("公司").fill("Acme");
    await page.getByLabel("关键词").fill("React, Next.js, Design Systems");

    await page.getByRole("button", { name: /预览/ }).click();

    await expect(page).toHaveURL(new RegExp(`/studio/${created.meta.id}/preview$`));
    await expect(page.getByRole("heading", { name: /Tailor Source/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /导出 pdf/i })).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});
