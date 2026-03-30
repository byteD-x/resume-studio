"use client";

import {
  Bot,
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  LayoutTemplate,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

export type EditorPanel =
  | "basics"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "targeting"
  | "ai"
  | "markdown";

export interface EditorPanelItem {
  key: EditorPanel;
  label: string;
  hint: string;
  status: "empty" | "in_progress" | "ready";
  countLabel?: string;
}

export function ResumeEditorSidebar({
  items,
  activePanel,
  onSelect,
}: {
  items: EditorPanelItem[];
  activePanel: EditorPanel;
  onSelect: (panel: EditorPanel) => void;
}) {
  const iconMap = {
    basics: UserRound,
    experience: BriefcaseBusiness,
    projects: LayoutTemplate,
    education: GraduationCap,
    skills: Sparkles,
    targeting: Target,
    ai: Bot,
    markdown: Code2,
  } satisfies Record<EditorPanel, typeof UserRound>;

  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar-block">
        <p className="editor-sidebar-label">编辑步骤</p>
        <div className="editor-sidebar-list">
          {items.map((item) => {
            const active = activePanel === item.key;
            const Icon = iconMap[item.key];
            return (
              <button
                className={`editor-sidebar-item ${active ? "editor-sidebar-item-active" : ""}`}
                key={item.key}
                onClick={() => onSelect(item.key)}
                type="button"
              >
                <span className="editor-sidebar-item-index">
                  <Icon className="size-4" />
                </span>
                <div className="editor-sidebar-item-copy">
                  <div className="editor-sidebar-item-titleline">
                    <strong>{item.label}</strong>
                  </div>
                  <span className="editor-sidebar-item-hint">{item.hint}</span>
                  <div className="editor-sidebar-item-meta">
                    <span className={`editor-sidebar-item-status editor-sidebar-item-status-${item.status}`}>
                      {item.status === "ready" ? "已完成" : item.status === "in_progress" ? "进行中" : "待开始"}
                    </span>
                    {item.countLabel ? <span className="editor-sidebar-item-note">{item.countLabel}</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
