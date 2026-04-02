import { expect, test } from "./fixtures/auth";

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
    await expect(page.getByRole("button", { name: new RegExp(source.meta.title) }).first()).toBeVisible();
    await expect(page.getByText("Acme Tailored Variant")).toBeVisible();
    await expect(page.getByRole("heading", { name: new RegExp(source.meta.title) })).toBeVisible();

    await page.goto(`/studio/${variantId}`);
    await expect(page.getByRole("button", { name: "查看来源" })).toBeVisible();
  } finally {
    if (variantId) {
      await request.delete(`/api/resumes/${variantId}`).catch(() => null);
    }
    await request.delete(`/api/resumes/${source.meta.id}`).catch(() => null);
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
    await Promise.all([
      page.waitForURL(/\/studio\/[^/?]+\?focus=ai$/),
      page.locator(".library-detail-actions").getByRole("button", { name: "生成定制版" }).click(),
    ]);
    variantId = page.url().match(/\/studio\/([^/?]+)/)?.[1] ?? null;

    await expect(page.getByRole("button", { name: "查看来源" })).toBeVisible();
  } finally {
    if (variantId) {
      await request.delete(`/api/resumes/${variantId}`).catch(() => null);
    }
    await request.delete(`/api/resumes/${source.meta.id}`).catch(() => null);
  }
});

test("library can create a two-page optimized version without changing the source draft", async ({ page, request }) => {
  const sourceResponse = await request.post("/api/resumes", {
    data: { title: `Optimize Source ${Date.now()}` },
  });
  expect(sourceResponse.ok()).toBeTruthy();
  const source = await sourceResponse.json();
  let optimizedId: string | null = null;

  try {
    await request.put(`/api/resumes/${source.meta.id}`, {
      data: {
        ...source,
        basics: {
          ...source.basics,
          name: "Jane Doe",
          headline: "Senior Frontend Engineer",
          summaryHtml: "<p>Owns complex resume and export workflows across product surfaces.</p>",
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
                title: "Senior Frontend Engineer",
                subtitle: "Acme",
                location: "",
                dateRange: "2023-2026",
                meta: "",
                summaryHtml: "<p>Built multi-step resume editing and preview flows.</p>",
                bulletPoints: ["Delivered a reusable editor workflow and PDF export preview."],
                tags: ["React", "Next.js"],
              },
            ],
          },
        ],
      },
    });

    await page.goto("/resumes");
    await Promise.all([
      page.waitForURL(/\/studio\/[^/?]+\?focus=content$/),
      page.locator(".library-detail-actions").getByRole("button", { name: "新增两页优化版" }).click(),
    ]);
    optimizedId = page.url().match(/\/studio\/([^/?]+)/)?.[1] ?? null;
    expect(optimizedId).not.toBeNull();
    await expect(
      request.get(`/api/resumes/${optimizedId}`).then((response) => response.ok()),
    ).resolves.toBe(true);

    await page.reload();
    await expect(page.locator(".editor-toolbar-titleinput")).toBeVisible({ timeout: 10000 });
    await expect(page.locator(".editor-toolbar-titleinput")).toHaveValue(/两页优化版/);
    await expect(page.getByRole("button", { name: "查看来源" })).toBeVisible();
  } finally {
    if (optimizedId) {
      await request.delete(`/api/resumes/${optimizedId}`).catch(() => null);
    }
    await request.delete(`/api/resumes/${source.meta.id}`).catch(() => null);
  }
});

test("library can delete a standalone draft from the detail actions", async ({ page, request }) => {
  const firstResponse = await request.post("/api/resumes", {
    data: { title: `Standalone Delete ${Date.now()}` },
  });
  const secondResponse = await request.post("/api/resumes", {
    data: { title: `Standalone Keep ${Date.now()}` },
  });
  const first = await firstResponse.json();
  const second = await secondResponse.json();

  try {
    await page.goto("/resumes");
    await page.getByRole("button", { name: new RegExp(first.meta.title) }).first().click();
    await page.locator(".library-detail-actions").getByRole("button", { name: "删除" }).click();
    await page.locator(".app-dialog").getByRole("button", { name: "确认删除" }).click();

    await expect(page.getByRole("button", { name: new RegExp(first.meta.title) })).toHaveCount(0);
    await expect(page.getByRole("button", { name: new RegExp(second.meta.title) }).first()).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${first.meta.id}`).catch(() => null);
    await request.delete(`/api/resumes/${second.meta.id}`).catch(() => null);
  }
});

test("library supports consecutive deletions without manual refresh", async ({ page, request }) => {
  const firstResponse = await request.post("/api/resumes", {
    data: { title: `Consecutive Delete A ${Date.now()}` },
  });
  const secondResponse = await request.post("/api/resumes", {
    data: { title: `Consecutive Delete B ${Date.now()}` },
  });
  const thirdResponse = await request.post("/api/resumes", {
    data: { title: `Consecutive Keep ${Date.now()}` },
  });
  const first = await firstResponse.json();
  const second = await secondResponse.json();
  const third = await thirdResponse.json();

  try {
    await page.goto("/resumes");

    await page.getByRole("button", { name: new RegExp(first.meta.title) }).first().click();
    await page.locator(".library-detail-actions").getByRole("button", { name: "删除" }).click();
    await page.locator(".app-dialog").getByRole("button", { name: "确认删除" }).click();
    await expect(page.getByRole("button", { name: new RegExp(first.meta.title) })).toHaveCount(0);

    await page.getByRole("button", { name: new RegExp(second.meta.title) }).first().click();
    await page.locator(".library-detail-actions").getByRole("button", { name: "删除" }).click();
    await page.locator(".app-dialog").getByRole("button", { name: "确认删除" }).click();
    await expect(page.getByRole("button", { name: new RegExp(second.meta.title) })).toHaveCount(0);

    await expect(page.getByRole("button", { name: new RegExp(third.meta.title) }).first()).toBeVisible();
  } finally {
    await request.delete(`/api/resumes/${first.meta.id}`).catch(() => null);
    await request.delete(`/api/resumes/${second.meta.id}`).catch(() => null);
    await request.delete(`/api/resumes/${third.meta.id}`).catch(() => null);
  }
});

test("library can cascade delete a source draft together with its variants", async ({ page, request }) => {
  const sourceResponse = await request.post("/api/resumes", {
    data: { title: `Cascade Source ${Date.now()}` },
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
                bulletPoints: ["Delivered reusable workflow tooling."],
                tags: ["React", "Next.js"],
              },
            ],
          },
        ],
      },
    });

    const variantResponse = await request.post(`/api/resumes/${source.meta.id}/generate-tailored-variant`, {
      data: { title: "Cascade Variant" },
    });
    const variant = await variantResponse.json();
    variantId = variant.document.meta.id;

    await page.goto("/resumes");
    await page.getByRole("button", { name: new RegExp(source.meta.title) }).first().click();
    await page.locator(".library-detail-actions").getByRole("button", { name: "删除整组" }).click();
    await page.locator(".app-dialog").getByRole("button", { name: "删除整组" }).click();

    await expect(page.getByRole("button", { name: new RegExp(source.meta.title) })).toHaveCount(0);
    await expect(page.getByText("Cascade Variant")).toHaveCount(0);
  } finally {
    if (variantId) {
      await request.delete(`/api/resumes/${variantId}`).catch(() => null);
    }
    await request.delete(`/api/resumes/${source.meta.id}`).catch(() => null);
  }
});
