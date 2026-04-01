"use client";

import { FileCode2, Globe, Type, UploadCloud } from "lucide-react";
import type { ImportSource } from "@/components/import/portfolio-import/types";

const tabs = [
  { id: "url", label: "网站链接", icon: Globe },
  { id: "markdown", label: "Markdown 文本", icon: FileCode2 },
  { id: "text", label: "纯文本片段", icon: Type },
  { id: "pdf", label: "PDF 文件", icon: UploadCloud },
] satisfies Array<{ id: ImportSource; label: string; icon: typeof Globe }>;

export function PortfolioImportTabs({
  activeTab,
  onChange,
}: {
  activeTab: ImportSource;
  onChange: (tab: ImportSource) => void;
}) {
  return (
    <div
      aria-label="导入方式"
      className="relative mb-6 flex overflow-x-auto border-b border-[color:var(--line)] hide-scrollbar"
      role="tablist"
    >
      <ul className="flex items-center gap-6 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <li key={tab.id}>
              <button
                aria-controls={`import-panel-${tab.id}`}
                aria-selected={isActive}
                className={`relative flex items-center gap-2 rounded-sm pb-3 pt-2 text-[0.9rem] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-300 ${
                  isActive
                    ? "font-medium text-[color:var(--ink-strong)]"
                    : "text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
                }`}
                id={`import-tab-${tab.id}`}
                onClick={() => onChange(tab.id)}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                type="button"
              >
                <Icon className="size-[1.1rem]" />
                {tab.label}
                {isActive ? (
                  <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-t-full bg-[color:var(--ink-strong)]" />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
