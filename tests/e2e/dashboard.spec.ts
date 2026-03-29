import { expect, test } from "@playwright/test";

test("dashboard renders primary entry point", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /把经历写成招聘方愿意继续看的简历/,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /创建引导草稿/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /从 portfolio 起稿/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /导入旧 pdf/i })).toBeVisible();
});

test("studio renders editor and preview", async ({ page }) => {
  await page.goto("/studio/default");
  await expect(page.getByRole("heading", { name: /章节设置/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^预览$/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /导出前检查/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /目标岗位与 jd 匹配度/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /自动生成定制版本/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /查看导出前检查/ })).toBeVisible();
  await expect(
    page.locator("#editor-export-checklist").getByRole("button", { name: /通过检查后导出 pdf/i }),
  ).toBeVisible();
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

    const titleField = page
      .locator("label:has-text('简历标题')")
      .locator("..")
      .locator("input");
    await titleField.fill(nextTitle);

    await expect(page.getByText(/已全部保存/)).toBeVisible({ timeout: 5000 });
    await page.reload();
    await expect(titleField).toHaveValue(nextTitle);
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
  }
});

test("studio generates a tailored variant from the current draft", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Tailor Source ${Date.now()}` },
  });
  const created = await createdResponse.json();
  let generatedId: string | null = null;

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
    await expect(page.getByRole("heading", { name: /自动生成定制版本/ })).toBeVisible();
    await expect(page.getByText(/Tailor Source · Acme/i)).toBeVisible();
    await page.getByRole("button", { name: /生成定制版本/ }).click();

    await expect(page).toHaveURL(/\/studio\/tailor-source-acme/);
    generatedId = page.url().split("/").pop() ?? null;

    await expect(page.getByRole("heading", { name: /Tailor Source · Acme/i })).toBeVisible();
    await expect(page.getByText(/保留 \d+ 条 \/ 删除 \d+ 条/)).toBeVisible();
    await expect(page.getByText("Office Move Support")).toHaveCount(0);
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`);
    if (generatedId) {
      await request.delete(`/api/resumes/${generatedId}`);
    }
  }
});
