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
      <section className="relative overflow-hidden rounded-[20px] border border-[#d9e4f2] bg-white shadow-[0_8px_24px_rgba(15,35,95,0.08)]">
        <div className="absolute inset-x-0 top-0 h-[120px] bg-[linear-gradient(90deg,rgba(22,93,255,0.08),rgba(22,93,255,0.02),transparent)]" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9e4f2] bg-[#f7faff] px-3 py-1 text-[12px] font-semibold text-[#165dff]">
              <Sparkles className="size-3.5" />
              Workspace
            </div>
            <div className="space-y-2">
              <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#1d2129] sm:text-[34px]">
                Resume Studio
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-[6px] bg-[#f2f3f5] px-2.5 py-1 text-[12px] font-medium text-[#4e5969]">
                  模板中心
                </span>
                <span className="rounded-[6px] bg-[#f2f3f5] px-2.5 py-1 text-[12px] font-medium text-[#4e5969]">
                  草稿库
                </span>
                <span className="rounded-[6px] bg-[#f2f3f5] px-2.5 py-1 text-[12px] font-medium text-[#4e5969]">
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
                className={`group relative overflow-hidden rounded-[20px] border border-[#d9e4f2] bg-gradient-to-br ${entry.tone} p-6 shadow-[0_8px_20px_rgba(15,35,95,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(15,35,95,0.1)]`}
                href={entry.href}
                key={entry.href}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-[8px] border border-[#d9e4f2] bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#4e5969]">
                    {entry.tag}
                  </span>
                  <span className="inline-flex size-12 items-center justify-center rounded-[14px] border border-[#d9e4f2] bg-white text-[#165dff] shadow-[0_6px_14px_rgba(22,93,255,0.12)]">
                    <Icon className="size-5" />
                  </span>
                </div>

                <div className="mt-16 flex items-end justify-between gap-4">
                  <h2 className="text-[24px] font-semibold tracking-[-0.03em] text-[#1d2129]">{entry.title}</h2>
                  <span className="inline-flex items-center gap-2 rounded-[10px] bg-[#165dff] px-3 py-2 text-[13px] font-semibold text-white">
                    进入
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <aside className="rounded-[20px] border border-[#d9e4f2] bg-white p-5 shadow-[0_8px_20px_rgba(15,35,95,0.06)]">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-[#1d2129]">Quick Entry</p>
          </div>

          <div className="mt-4 space-y-3">
            {subEntries.map((entry) => {
              const Icon = entry.icon;

              return (
                <Link
                  className="group flex items-center justify-between rounded-[16px] border border-[#e5e6eb] bg-[#f7f8fa] px-4 py-4 transition hover:border-[#bed0ff] hover:bg-[#f7faff]"
                  href={entry.href}
                  key={entry.href}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-[12px] bg-white text-[#165dff] shadow-[0_4px_12px_rgba(15,35,95,0.08)]">
                      <Icon className="size-4.5" />
                    </span>
                    <span className="text-[15px] font-medium text-[#1d2129]">{entry.title}</span>
                  </div>

                  <ArrowRight className="size-4 text-[#86909c] transition group-hover:text-[#165dff]" />
                </Link>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}
