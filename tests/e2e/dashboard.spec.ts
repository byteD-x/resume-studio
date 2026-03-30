import { expect, test } from "@playwright/test";

test("dashboard renders the focused entry surface", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /先把内容写对，再让版式替你完成工作/,
    }),
  ).toBeVisible();
  await expect(page.getByText(/本地优先/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /从模板开始/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /导入旧 pdf/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /打开草稿库/ }).first()).toBeVisible();
  await expect(page.getByText("版本管理", { exact: true })).toBeVisible();
});

test("resumes library stays accessible without auth", async ({ page }) => {
  await page.goto("/resumes");
  await expect(page).toHaveURL(/\/resumes$/);
  await expect(page.getByRole("heading", { name: /在这里管理主稿、定向版本和推进状态/ })).toBeVisible();
  await expect(page.getByLabel(/搜索简历/)).toBeVisible();
});

test("templates page explains the current writer profile and creation flow", async ({ page }) => {
  await page.goto("/templates");
  await expect(page.getByRole("heading", { name: /先确定求职语境，再挑一个稳的版式/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /有经验求职/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /用这个模板创建草稿/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /创建草稿并导入 pdf/i })).toBeVisible();
  await page.getByRole("tab", { name: /作品集数据/ }).click();
  await expect(page.getByLabel(/作品集路径/)).toBeVisible();
});

test("templates page can import portfolio data into an editor review flow", async ({ page, request }) => {
  let createdId: string | null = null;

  try {
    await page.goto("/templates");
    await page.getByRole("tab", { name: /作品集数据/ }).click();
    await page.getByRole("button", { name: /创建草稿并导入作品集/ }).click();

    await page.waitForURL(/\/studio\/[^/?]+\?onboarding=portfolio&focus=content/);
    createdId = page.url().match(/\/studio\/([^/?]+)/)?.[1] ?? null;

    await expect(page.locator(".resume-editor-import-banner")).toBeVisible();
    await expect(page.getByText(/作品集导入已完成/)).toBeVisible();
    await expect(page.locator(".editor-toolbar-titleinput")).toHaveValue(/Resume/);
  } finally {
    if (createdId) {
      await request.delete(`/api/resumes/${createdId}`);
    }
  }
});

test("studio renders the current editor shell and workflow strip", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Editor Shell ${Date.now()}`, starter: "guided" },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}`);
    await expect(page.locator(".editor-toolbar-titleinput")).toBeVisible();
    await expect(page.getByRole("tab", { name: /表单/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /markdown/i })).toBeVisible();
    await expect(page.locator(".editor-workflow-strip")).toBeVisible();
    await expect(page.getByRole("button", { name: /预览导出/ }).first()).toBeVisible();
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

    await expect(page.getByText(/已保存/).first()).toBeVisible({ timeout: 5000 });
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
            ],
          },
        ],
      },
    });

    await page.goto(`/studio/${created.meta.id}`);
    await page.locator(".editor-sidebar-item").nth(5).click();

    const inputs = page.locator(".resume-editor-main .input-control");
    await inputs.nth(0).fill("Staff Frontend Engineer");
    await inputs.nth(1).fill("Acme");
    await page.locator(".resume-editor-main .textarea-control").first().fill("React, Next.js, Design Systems");

    await page.getByRole("button", { name: /预览导出/ }).first().click();

    await expect(page).toHaveURL(new RegExp(`/studio/${created.meta.id}/preview$`));
    await expect(page.getByRole("heading", { name: /Tailor Source/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /导出 pdf/i })).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});
