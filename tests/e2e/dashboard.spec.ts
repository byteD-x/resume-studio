import { expect, test } from "@playwright/test";

test("dashboard renders the current resume library entry surface", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "我的简历" })).toBeVisible();
  await expect(page.getByText("在这里管理主稿、岗位定向版本，以及每份简历当前最值得推进的下一步。")).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "开始新简历" })).toBeVisible();
});

test("resumes library stays accessible without auth", async ({ page }) => {
  await page.goto("/resumes");
  await expect(page).toHaveURL(/\/resumes$/);
  await expect(page.getByRole("heading", { name: "我的简历" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "开始新简历" })).toBeVisible();
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
    await page.getByRole("textbox").fill([
      "Jane Doe",
      "Frontend Engineer",
      "Built growth surfaces and project pages.",
      "Project",
      "Resume Studio",
      "Built a structured resume editor.",
    ].join("\n"));

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

    await expect(page.getByText("已保存").first()).toBeVisible({ timeout: 5000 });
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
    await page.locator(".editor-sidebar").getByRole("button", { name: /岗位信息/ }).first().click();

    const inputs = page.locator(".resume-editor-main .input-control");
    await inputs.nth(0).fill("Staff Frontend Engineer");
    await inputs.nth(1).fill("Acme");
    await page.locator(".resume-editor-main .textarea-control").first().fill("React, Next.js, Design Systems");

    await page.getByRole("button", { name: "导出预览" }).first().click();

    await expect(page).toHaveURL(new RegExp(`/studio/${created.meta.id}/preview$`));
    await expect(page.getByRole("heading", { name: /Tailor Source/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /导出 pdf/i })).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("library and editor surface tailored variant lineage", async ({ page, request }) => {
  const sourceResponse = await request.post("/api/resumes", {
    data: { title: `Lineage Source ${Date.now()}` },
  });
  const source = await sourceResponse.json();
  let variantId: string | null = null;

  try {
    await request.put(`/api/resumes/${source.meta.id}`, {
      data: {
        ...source,
        targeting: {
          ...source.targeting,
          role: "Frontend Engineer",
          company: "Acme",
          focusKeywords: ["React", "Next.js"],
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
                title: "Frontend Engineer",
                subtitle: "Acme",
                location: "",
                dateRange: "2024-2026",
                meta: "",
                summaryHtml: "<p>Built Next.js and React application flows.</p>",
                bulletPoints: ["Shipped a reusable React UI workflow."],
                tags: ["React", "Next.js"],
              },
            ],
          },
        ],
      },
    });

    const variantResponse = await request.post(`/api/resumes/${source.meta.id}/generate-tailored-variant`, {
      data: { title: "Acme Tailored Variant" },
    });
    const variant = await variantResponse.json();
    variantId = variant.document.meta.id;

    await page.goto("/resumes");
    await expect(page.locator(".library-master-detail")).toBeVisible();
    await expect(page.getByRole("button", { name: /Lineage Source/ }).first()).toBeVisible();
    await expect(page.getByText("这份主稿下共有 1 个岗位定制版，可以在右侧集中切换和管理。")).toBeVisible();
    await expect(page.getByText("Acme Tailored Variant")).toBeVisible();
    await expect(page.getByText(/基于[「《]Lineage Source/)).toBeVisible();

    await page.goto(`/studio/${variantId}`);
    await expect(page.getByText("当前正在编辑一份岗位定制版。")).toBeVisible();
    await expect(page.getByRole("button", { name: "查看来源主稿" })).toBeVisible();
  } finally {
    if (variantId) {
      await request.delete(`/api/resumes/${variantId}`);
    }
    await request.delete(`/api/resumes/${source.meta.id}`);
  }
});

test("library can generate the first tailored variant from a ready source draft", async ({ page, request }) => {
  const sourceResponse = await request.post("/api/resumes", {
    data: { title: `Library Generate ${Date.now()}` },
  });
  const source = await sourceResponse.json();
  let variantId: string | null = null;

  try {
    await request.put(`/api/resumes/${source.meta.id}`, {
      data: {
        ...source,
        targeting: {
          ...source.targeting,
          role: "Frontend Engineer",
          company: "Acme",
          focusKeywords: ["React", "Next.js"],
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
                title: "Frontend Engineer",
                subtitle: "Acme",
                location: "",
                dateRange: "2024-2026",
                meta: "",
                summaryHtml: "<p>Built React and Next.js product flows.</p>",
                bulletPoints: ["Delivered resume workflow surfaces for multiple job targets."],
                tags: ["React", "Next.js"],
              },
            ],
          },
        ],
      },
    });

    await page.goto("/resumes");
    await expect(page.getByText("可直接生成定制版").first()).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/studio\/[^/?]+\?focus=ai$/),
      page.locator(".library-detail-actions").getByRole("button", { name: "直接生成定制版", exact: true }).click(),
    ]);
    variantId = page.url().match(/\/studio\/([^/?]+)/)?.[1] ?? null;

    await expect(page.getByText("当前正在编辑一份岗位定制版。")).toBeVisible();
    await expect(page.getByRole("button", { name: "查看来源主稿" })).toBeVisible();
  } finally {
    if (variantId) {
      await request.delete(`/api/resumes/${variantId}`);
    }
    await request.delete(`/api/resumes/${source.meta.id}`);
  }
});
