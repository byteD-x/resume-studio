"use client";

import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileArchive,
  FolderOpenDot,
  LayoutGrid,
  Plus,
  Sparkles,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { useRouteWarmup } from "@/components/product/useRouteWarmup";

const mainEntries = [
  {
    href: "/templates" as Route,
    title: "模板中心",
    tag: "Start",
    icon: LayoutGrid,
    tone: "from-[#f3f7ff] via-[#edf4ff] to-[#ffffff]",
  },
  {
    href: "/resumes" as Route,
    title: "草稿库",
    tag: "Library",
    icon: FolderOpenDot,
    tone: "from-[#f7f9fc] via-[#f3f6fb] to-[#ffffff]",
  },
] as const;

const subEntries = [
  {
    href: "/import" as Route,
    title: "导入起稿",
    icon: FileArchive,
  },
] as const;

export function HomeHubPage() {
  useRouteWarmup({
    includeLastResume: true,
    routes: ["/templates", "/resumes", "/import"],
  });

  return (
    <main className="page-wrap py-8 sm:py-10">
      <section className="relative overflow-hidden rounded-[20px] border border-[color:var(--line)] bg-white shadow-[0_8px_24px_rgba(15,35,95,0.08)]">
        <div className="absolute inset-x-0 top-0 h-[200px] bg-[linear-gradient(90deg,color-mix(in srgb, var(--accent-strong) 8%, transparent),color-mix(in srgb, var(--accent-strong) 2%, transparent),transparent)]" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--accent-soft)] px-3 py-1 text-[12px] font-semibold text-[color:var(--accent-strong)]">
              <Sparkles className="size-3.5" />
              Workspace
            </div>
            <div className="space-y-2">
              <p className="text-[28px] font-semibold tracking-[-0.03em] text-[color:var(--ink-strong)] sm:text-[34px]">
                Resume Studio
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-[6px] bg-[color:var(--paper-soft)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--ink-soft)]">
                  模板中心
                </span>
                <span className="rounded-[6px] bg-[color:var(--paper-soft)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--ink-soft)]">
                  草稿库
                </span>
                <span className="rounded-[6px] bg-[color:var(--paper-soft)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--ink-soft)]">
                  导入起稿
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink className="min-w-[120px]" href="/templates">
              <Plus className="size-4" />
              新建
            </ButtonLink>
            <ButtonLink className="min-w-[120px]" href="/resumes" variant="secondary">
              打开草稿
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-5 md:grid-cols-2">
          {mainEntries.map((entry) => {
            const Icon = entry.icon;

            return (
              <Link
                aria-label={`进入${entry.title}`}
                className={`group relative overflow-hidden rounded-[var(--radius-xl)] border border-[color:color-mix(in srgb,var(--line)_90%,transparent)] bg-gradient-to-br ${entry.tone} p-6 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-medium)]`}
                href={entry.href}
                key={entry.href}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-[var(--radius-sm)] border border-[color:color-mix(in srgb,var(--line)_90%,transparent)] bg-white/90 px-3 py-1 text-[var(--text-xs)] font-semibold text-[color:var(--ink-soft)]">
                    {entry.tag}
                  </span>
                  <span className="inline-flex size-12 items-center justify-center rounded-[var(--radius-md)] border border-[color:color-mix(in srgb,var(--line)_90%,transparent)] bg-white text-[color:var(--accent-strong)] shadow-[0_6px_14px_rgba(22,93,255,0.12)]">
                    <Icon className="size-5" />
                  </span>
                </div>

                <div className="mt-16 flex items-end justify-between gap-4">
                  <h2 className="text-[var(--text-3xl)] font-semibold tracking-[-0.03em] text-[color:var(--ink-strong)]">{entry.title}</h2>
                  <span className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[color:var(--accent-strong)] px-3 py-2 text-[var(--text-sm)] font-semibold text-white">
                    进入
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <aside className="rounded-[var(--radius-xl)] border border-[color:color-mix(in srgb,var(--line)_90%,transparent)] bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <p className="text-[var(--text-lg)] font-semibold text-[color:var(--ink-strong)]">Quick Entry</p>
          </div>

          <div className="mt-4 space-y-3">
            {subEntries.map((entry) => {
              const Icon = entry.icon;

              return (
                <Link
                  aria-label={entry.title}
                  className="group flex items-center justify-between rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[color:var(--paper-soft)] px-4 py-4 transition hover:border-[color:color-mix(in srgb,var(--accent-strong)_16%,white)] hover:bg-[color:var(--accent-soft)]"
                  href={entry.href}
                  key={entry.href}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-white text-[color:var(--accent-strong)] shadow-[0_4px_12px_rgba(15,35,95,0.08)]">
                      <Icon className="size-4.5" />
                    </span>
                    <span className="text-[var(--text-md)] font-medium text-[color:var(--ink-strong)]">{entry.title}</span>
                  </div>

                  <ArrowRight className="size-4 text-[color:var(--ink-muted)] transition group-hover:text-[color:var(--accent-strong)]" />
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
