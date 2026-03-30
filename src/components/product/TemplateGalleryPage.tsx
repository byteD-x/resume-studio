"use client";

import { FileArchive, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import {
  templateCatalog,
  templateCategories,
  type TemplateCatalogItem,
} from "@/data/template-catalog";
import { cn } from "@/lib/utils";
import type { ResumeDocument, ResumeWriterProfile } from "@/types/resume";

const writerProfiles: Array<{
  value: ResumeWriterProfile;
  label: string;
  description: string;
}> = [
  {
    value: "experienced",
    label: "有经验求职",
    description: "突出业务影响、职责范围和结果。",
  },
  {
    value: "campus",
    label: "校招 / 应届",
    description: "教育、项目和实习更靠前。",
  },
  {
    value: "career-switch",
    label: "转岗 / 跨行业",
    description: "强调相关经历和可迁移能力。",
  },
];

const cardClassName =
  "rounded-[1.5rem] border border-[color:var(--line)] bg-white/92 shadow-[0_16px_36px_rgba(15,23,42,0.05)]";
const labelClassName =
  "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]";

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
  const [isPending, startTransition] = useTransition();
  const [activeCategory, setActiveCategory] = useState<(typeof templateCategories)[number]>("全部");
  const [writerProfile, setWriterProfile] = useState<ResumeWriterProfile>("experienced");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyImport, setBusyImport] = useState<"pdf" | "portfolio" | null>(null);
  const [status, setStatus] = useState("选择模板后会直接进入编辑页。");

  const currentWriterProfile = writerProfiles.find((profile) => profile.value === writerProfile)!;

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
    setStatus(`正在创建 ${template.name}`);

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

  const startImport = async (onboarding: "pdf" | "portfolio") => {
    setBusyImport(onboarding);
    setStatus("正在创建草稿…");

    try {
      const document = await getJson<ResumeDocument>(
        await fetch("/api/resumes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "未命名简历",
            starter: "blank",
          }),
        }),
      );

      startTransition(() => {
        router.push(`/studio/${document.meta.id}?onboarding=${onboarding}`);
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建失败。");
      setBusyImport(null);
    }
  };

  return (
    <main className="page-wrap">
      <section className={cardClassName}>
        <div className="flex flex-col gap-6 p-7 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className={labelClassName}>模板</p>
            <h1 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.05em] text-[color:var(--ink-strong)]">
              选择模板开始
            </h1>
            <p className="mt-3 text-base leading-8 text-[color:var(--ink-soft)]">
              模板是默认起点。先选适合的版式，再进入编辑器补齐内容；如果你已经有旧简历，也可以直接从这里导入。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              className="btn btn-secondary"
              disabled={busyImport !== null}
              onClick={() => void startImport("pdf")}
              type="button"
            >
              <FileArchive aria-hidden="true" className="size-4" />
              {busyImport === "pdf" ? "正在创建…" : "导入旧 PDF"}
            </button>
            <button
              className="btn btn-secondary"
              disabled={busyImport !== null}
              onClick={() => void startImport("portfolio")}
              type="button"
            >
              <Upload aria-hidden="true" className="size-4" />
              {busyImport === "portfolio" ? "正在创建…" : "导入作品集"}
            </button>
            <ButtonLink href="/resumes" variant="ghost">
              我的简历
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={cn(cardClassName, "mt-6 p-7 sm:p-8")}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <p className={labelClassName}>求职类型</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {writerProfiles.map((profile) => {
                const active = writerProfile === profile.value;

                return (
                  <button
                    className={`filter-chip ${active ? "filter-chip-active" : ""}`}
                    key={profile.value}
                    onClick={() => setWriterProfile(profile.value)}
                    type="button"
                  >
                    {profile.label}
                  </button>
                );
              })}
            </div>

            <p className={labelClassName + " mt-6"}>模板分类</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {templateCategories.map((category) => (
                <button
                  className={`filter-chip ${activeCategory === category ? "filter-chip-active" : ""}`}
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.2rem] border border-[color:var(--line)] bg-[color:var(--paper-soft)] p-5">
            <p className={labelClassName}>当前选择</p>
            <p className="mt-3 text-lg font-semibold text-[color:var(--ink-strong)]">
              {currentWriterProfile.label}
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
              {currentWriterProfile.description}
            </p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--ink-soft)]">
              当前可选 {templates.length} 个模板。
            </p>
          </div>
        </div>

        <p aria-live="polite" className="mt-5 text-sm text-[color:var(--ink-soft)]">
          {status}
        </p>
      </section>

      {templates.length > 0 ? (
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {templates.map((template) => {
            const recommended = template.recommendedProfiles.includes(writerProfile);

            return (
              <article className={cardClassName} key={template.id}>
                <TemplatePreview template={template} />

                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="filter-chip filter-chip-active">{template.category}</span>
                    <span className="filter-chip">{template.subtitle}</span>
                    {recommended ? <span className="filter-chip">推荐当前类型</span> : null}
                  </div>

                  <h2 className="mt-4 text-[1.5rem] font-semibold tracking-[-0.04em] text-[color:var(--ink-strong)]">
                    {template.name}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--ink-soft)]">
                    {template.summary}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
                    {template.highlights.join(" · ")}
                  </p>

                  <div className="mt-6">
                    <Button
                      className="w-full justify-center"
                      disabled={isPending}
                      onClick={() => void createResume(template)}
                      variant={selectedId === template.id ? "secondary" : "primary"}
                    >
                      {selectedId === template.id && isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      用这个模板开始
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-6 empty-surface">
          <p className="empty-surface-title">没有匹配的模板</p>
          <p className="empty-surface-text">换一个求职类型或模板分类试试。</p>
        </section>
      )}
    </main>
  );
}
