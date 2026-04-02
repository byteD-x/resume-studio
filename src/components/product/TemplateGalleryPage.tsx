"use client";

import Image from "next/image";
import type { Route } from "next";
import { ArrowLeft, FileArchive, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useRouteWarmup } from "@/components/product/useRouteWarmup";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  templateCatalog,
  templateCategories,
  type TemplateCatalogItem,
} from "@/data/template-catalog";
import type { ResumeDocument, ResumeWriterProfile } from "@/types/resume";

const writerProfiles: Array<{
  value: ResumeWriterProfile;
  label: string;
  description: string;
}> = [
  {
    value: "experienced",
    label: "有经验求职",
    description: "强调业务影响、职责范围和结果表达。",
  },
  {
    value: "campus",
    label: "校招 / 应届",
    description: "让教育、项目和实习更靠前展示。",
  },
  {
    value: "career-switch",
    label: "转岗 / 跨行业",
    description: "突出相关经历、迁移能力和转向动机。",
  },
];

const cardClassName = "rounded-[0.75rem] border border-[color:var(--line)] bg-white/92 shadow-sm";

async function getJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error((await response.text()) || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function TemplatePreview({ template }: { template: TemplateCatalogItem }) {
  return (
    <div
      className="flex min-h-[15rem] items-center justify-center border-b border-[color:var(--line)] px-4 py-5"
      style={{ background: template.background }}
    >
      <div className="w-full max-w-[15.5rem] overflow-hidden rounded-[1rem] border border-white/70 bg-white/80 shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
        <Image
          alt={template.previewAlt}
          className="block h-auto w-full"
          height={1470}
          loading="lazy"
          src={template.previewImage}
          width={1040}
        />
      </div>
    </div>
  );
}

export function TemplateGalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  useRouteWarmup({
    includeLastResume: true,
    routes: ["/import", "/resumes"],
  });

  const activeCategory =
    templateCategories.find((category) => category === searchParams.get("category")) ?? "全部";
  const writerProfile =
    searchParams.get("profile") === "campus" || searchParams.get("profile") === "career-switch"
      ? (searchParams.get("profile") as ResumeWriterProfile)
      : "experienced";

  const updateTemplateRoute = (updates: Partial<Record<"category" | "profile", string | null>>) => {
    const params = new URLSearchParams(searchParams.toString());
    (Object.entries(updates) as Array<["category" | "profile", string | null]>).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    const query = params.toString();
    const href = (query ? `/templates?${query}` : "/templates") as Route;
    router.replace(href, { scroll: false });
  };

  const templates = useMemo(() => {
    const filtered =
      activeCategory === "全部"
        ? templateCatalog
        : templateCatalog.filter((item) => item.category === activeCategory);

    return [...filtered].sort((left, right) => {
      const leftRecommended = left.recommendedProfiles.includes(writerProfile) ? 1 : 0;
      const rightRecommended = right.recommendedProfiles.includes(writerProfile) ? 1 : 0;
      return rightRecommended - leftRecommended || left.name.localeCompare(right.name);
    });
  }, [activeCategory, writerProfile]);

  const createResume = async (template: TemplateCatalogItem) => {
    setSelectedId(template.id);
    setStatus(`正在创建 ${template.name}...`);

    try {
      const document = await getJson<ResumeDocument>(
        await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "未命名简历",
            starter: "template-sample",
            writerProfile,
            template: template.id,
          }),
        }),
      );

      router.prefetch(`/studio/${document.meta.id}`);
      router.prefetch(`/studio/${document.meta.id}/preview`);
      startTransition(() => {
        router.push(`/studio/${document.meta.id}?onboarding=template&focus=basics`);
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建失败。");
      setSelectedId(null);
    }
  };

  return (
    <main className="page-wrap">
      <section className="mb-5 flex flex-col items-start justify-between gap-4 border-b border-[color:var(--line)] pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-[1.8rem] font-bold tracking-tight text-[color:var(--ink-strong)]">新建简历</h1>
          <p aria-live="polite" className="mt-2 text-[0.85rem] text-[color:var(--accent-strong)] empty:hidden">
            {status}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/" variant="ghost">
            <ArrowLeft aria-hidden="true" className="size-4" />
            返回
          </ButtonLink>
          <ButtonLink href="/import" variant="secondary">
            <FileArchive aria-hidden="true" className="size-4" />
            导入简历
          </ButtonLink>
        </div>
      </section>

      <section className="mb-7 flex flex-col items-start gap-5 rounded-[0.75rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-3 px-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-[0.75rem] font-bold uppercase tracking-wider text-[color:var(--ink-muted)]">
            求职语境
          </span>
          <div className="flex flex-wrap gap-2">
            {writerProfiles.map((profile) => {
              const active = writerProfile === profile.value;
              return (
                <button
                  aria-pressed={active}
                  className={`filter-chip ${active ? "filter-chip-active" : ""}`}
                  key={profile.value}
                  onClick={() => updateTemplateRoute({ profile: profile.value })}
                  title={profile.description}
                  type="button"
                >
                  {profile.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden h-5 w-px bg-[color:var(--line)] sm:block" />

        <div className="flex items-center gap-3">
          <span className="shrink-0 text-[0.75rem] font-bold uppercase tracking-wider text-[color:var(--ink-muted)]">
            排版分类
          </span>
          <div className="flex flex-wrap gap-2">
            {templateCategories.map((category) => (
              <button
                aria-pressed={activeCategory === category}
                className={`filter-chip ${activeCategory === category ? "filter-chip-active" : ""}`}
                key={category}
                onClick={() => updateTemplateRoute({ category: category === "全部" ? null : category })}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {templates.length > 0 ? (
        <section className="grid gap-5 lg:grid-cols-3">
          {templates.map((template) => {
            const recommended = template.recommendedProfiles.includes(writerProfile);

            return (
              <article className={cardClassName} key={template.id}>
                <TemplatePreview template={template} />

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{template.category}</Badge>
                    {recommended ? <Badge tone="success">当前适配</Badge> : null}
                  </div>

                  <h2 className="mt-4 text-[1.12rem] font-bold tracking-tight text-[color:var(--ink-strong)]">
                    {template.name}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 h-[2.5rem] text-[0.88rem] leading-relaxed text-[color:var(--ink-soft)]">
                    {template.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {template.highlights.slice(0, 3).map((highlight) => (
                      <span className="filter-chip px-2 py-0.5 text-[0.72rem]" key={highlight}>
                        {highlight}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5">
                    <Button
                      className="w-full justify-center"
                      disabled={isPending}
                      onClick={() => void createResume(template)}
                      variant={selectedId === template.id ? "secondary" : "primary"}
                    >
                      {selectedId === template.id && isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      {selectedId === template.id ? "准备进入工作区..." : "选择此模板"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="empty-surface mt-6">
          <p className="empty-surface-title">没有匹配的模板</p>
          <p className="empty-surface-text">换一个分类试试。</p>
        </section>
      )}
    </main>
  );
}
