"use client";

import {
  Bot,
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  LayoutTemplate,
  Palette,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react";

export type EditorPanel =
  | "basics"
  | "design"
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

export interface EditorPanelGroup {
  key: string;
  label: string;
  description: string;
  items: EditorPanelItem[];
}

function panelStatusLabel(status: EditorPanelItem["status"]) {
  switch (status) {
    case "ready":
      return "已完成";
    case "in_progress":
      return "编辑中";
    default:
      return "未开始";
  }
}

export function ResumeEditorSidebar({
  groups,
  activePanel,
  onSelect,
}: {
  groups: EditorPanelGroup[];
  activePanel: EditorPanel;
  onSelect: (panel: EditorPanel) => void;
}) {
  const iconMap = {
    basics: UserRound,
    design: Palette,
    experience: BriefcaseBusiness,
    projects: LayoutTemplate,
    education: GraduationCap,
    skills: Sparkles,
    targeting: Target,
    ai: Bot,
    markdown: Code2,
  } satisfies Record<EditorPanel, typeof UserRound>;

  return (
    <aside aria-label="简历编辑模块" className="editor-sidebar editor-sidebar-rail">
      <div className="editor-sidebar-block">
        {groups.map((group) => (
          <section className="editor-sidebar-group" key={group.key}>
            <span className="sr-only">{group.label}</span>

            <div className="editor-sidebar-list" role="list">
              {group.items.map((item) => {
                const active = activePanel === item.key;
                const Icon = iconMap[item.key];
                const statusLabel = panelStatusLabel(item.status);

                return (
                  <button
                    aria-label={[item.label, statusLabel, item.countLabel].filter(Boolean).join("，")}
                    aria-pressed={active}
                    className={`editor-sidebar-item ${active ? "editor-sidebar-item-active" : ""}`}
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    type="button"
                  >
                    <span className="editor-sidebar-item-index" aria-hidden="true">
                      <Icon className="editor-sidebar-icon" />
                    </span>

                    <span
                      aria-hidden="true"
                      className={`editor-sidebar-item-dot editor-sidebar-item-dot-${item.status}`}
                    />

                    <span className="editor-sidebar-tooltip" role="presentation">
                      <strong>{item.label}</strong>
                      <span>{item.hint || statusLabel}</span>
                      <em>{item.countLabel ?? statusLabel}</em>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}
