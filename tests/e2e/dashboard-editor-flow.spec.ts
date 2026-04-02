import { expect, test } from "./fixtures/auth";

test("studio auto-saves edits and keeps them after reload", async ({ page, request }) => {
  test.slow();
  const createdTitle = `Autosave Draft ${Date.now()}`;
  const nextTitle = `Autosave Smoke ${Date.now()}`;
  const createdResponse = await request.post("/api/resumes", {
    data: { title: createdTitle },
  });
  const created = await createdResponse.json();

  try {
    await page.goto(`/studio/${created.meta.id}`);

    const titleField = page.locator(".editor-toolbar-titleinput");
    const saveRequest = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/resumes/${created.meta.id}`) &&
        response.request().method() === "PUT" &&
        response.ok(),
      { timeout: 10000 },
    );
    await titleField.click();
    await titleField.selectText();
    await titleField.pressSequentially(nextTitle);
    await saveRequest;

    await page.reload();
    await expect(titleField).toHaveValue(nextTitle);
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`).catch(() => null);
  }
});

test("studio carries targeting edits into preview flow", async ({ page, request }) => {
  test.slow();
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

    await page.goto(`/studio/${created.meta.id}?focus=targeting`);

    const inputs = page.locator(".resume-editor-main .input-control");
    await inputs.nth(0).fill("Staff Frontend Engineer");
    await inputs.nth(1).fill("Acme");
    await page.locator(".resume-editor-main .textarea-control").first().fill("React, Next.js, Design Systems");

    await page.getByRole("button", { name: "预览" }).first().click();

    await expect(page).toHaveURL(new RegExp(`/studio/${created.meta.id}/preview$`));
    await expect(page.getByRole("heading", { name: /Tailor Source/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /导出 PDF/i })).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`).catch(() => null);
  }
});

test("studio keeps basics fields visible at desktop and medium widths", async ({ page, request }) => {
  const createdResponse = await request.post("/api/resumes", {
    data: { title: `Editor Layout ${Date.now()}` },
  });
  const created = await createdResponse.json();

  try {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto(`/studio/${created.meta.id}`);

    const nameField = page.getByLabel("姓名");
    await expect(nameField).toBeVisible();
    await nameField.fill("Layout Visible");
    await page.waitForTimeout(1500);

    await page.setViewportSize({ width: 1180, height: 900 });
    await page.reload();
    await expect(page.getByLabel("姓名")).toBeVisible();
    await expect(page.locator(".resume-editor-main .editor-surface-section")).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${created.meta.id}`).catch(() => null);
  }
});
