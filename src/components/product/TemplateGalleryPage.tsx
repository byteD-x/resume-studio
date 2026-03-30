"use client";

import type { Route } from "next";
import { FileArchive, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
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
    description: "突出业务影响、职责范围和结果表达。",
  },
  {
    value: "campus",
    label: "校招 / 应届",
    description: "教育、项目和实习应该更靠前展示。",
  },
  {
    value: "career-switch",
    label: "转岗 / 跨行业",
    description: "强调相关经历、迁移能力和转向动机。",
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
      className="flex min-h-[15rem] items-center justify-center border-b border-[color:var(--line)] px-6 py-8"
      style={{ background: template.background }}
    >
      <div className="w-full max-w-[17rem] rounded-[1.1rem] bg-white/90 px-5 py-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
        <p className="text-[0.82rem] font-semibold tracking-[0.18em]" style={{ color: template.accent }}>
          {template.name.toUpperCase()}
        </p>
        <div className="mt-5 grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
          <div className="grid gap-2">
            <span className="block h-2 rounded-full bg-slate-200" />
            <span className="block h-2 rounded-full bg-slate-200" />
            <span className="block h-2 rounded-full bg-slate-200" />
            <span className="block h-2 rounded-full bg-slate-200" />
          </div>
          <div className="grid gap-2">
            <span className="block h-2 rounded-full bg-slate-200" />
            <span className="block h-2 rounded-full bg-slate-200" />
            <span className="block h-2 rounded-full bg-slate-200" />
            <span className="block h-2 rounded-full bg-slate-200" />
          </div>
        </div>
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

  const activeCategory =
    templateCategories.find((category) => category === searchParams.get("category")) ?? "全部";
  const writerProfile =
    searchParams.get("profile") === "campus" || searchParams.get("profile") === "career-switch"
      ? (searchParams.get("profile") as ResumeWriterProfile)
      : "experienced";

  const updateTemplateRoute = (updates: Partial<Record<"category" | "profile", string | null>>) => {
    const params = new URLSearchParams(searchParams.toString());
    (Object.entries(updates) as Array<["category" | "profile", string | null]>).forEach(
      ([key, value]) => {
        if (!value) params.delete(key);
        else params.set(key, value);
      },
    );
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
            starter: "guided",
            writerProfile,
            template: template.template,
          }),
        }),
      );

      startTransition(() => {
        router.push(`/studio/${document.meta.id}`);
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建失败。");
      setSelectedId(null);
    }
  };

  return (
    <main className="page-wrap">
      <section className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[color:var(--line)] pb-5 mb-5 gap-4">
        <div>
          <h1 className="text-[1.8rem] font-bold tracking-tight text-[color:var(--ink-strong)]">
            新建简历
          </h1>
          <p className="mt-1.5 text-[0.92rem] text-[color:var(--ink-soft)]">
            直接挑选一个版式开始。
          </p>
          <p aria-live="polite" className="mt-2 text-[0.85rem] text-[color:var(--accent-strong)] empty:hidden">
            {status}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href="/import"
            variant="secondary"
          >
            <FileArchive aria-hidden="true" className="size-4" />
            解析源文件或导入线上经历
          </ButtonLink>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row gap-5 mb-7 items-start sm:items-center bg-[color:var(--paper-soft)] p-3 px-4 rounded-[0.75rem] border border-[color:var(--line)]">
        <div className="flex items-center gap-3">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-[color:var(--ink-muted)] shrink-0">求职语境</span>
          <div className="flex flex-wrap gap-2">
            {writerProfiles.map((profile) => {
              const active = writerProfile === profile.value;
              return (
                <button
                  key={profile.value}
                  className={`filter-chip ${active ? "filter-chip-active" : ""}`}
                  onClick={() => updateTemplateRoute({ profile: profile.value })}
                  type="button"
                >
                  {profile.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden sm:block w-px h-5 bg-[color:var(--line)]" />

        <div className="flex items-center gap-3">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-[color:var(--ink-muted)] shrink-0">排版分类</span>
          <div className="flex flex-wrap gap-2">
            {templateCategories.map((category) => (
              <button
                key={category}
                className={`filter-chip ${activeCategory === category ? "filter-chip-active" : ""}`}
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
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-[color:var(--ink-soft)] h-[2.5rem] line-clamp-2">
                    {template.summary}
                  </p>
                  
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {template.highlights.slice(0, 3).map((highlight) => (
                      <span className="filter-chip text-[0.72rem] px-2 py-0.5" key={highlight}>
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
                      {selectedId === template.id ? "准备进入工作区..." : "选择此排版"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-6 empty-surface">
          <p className="empty-surface-title">没有匹配的排版</p>
          <p className="empty-surface-text">换一个分类试试。</p>
        </section>
      )}
    </main>
  );
}
