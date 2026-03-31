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
      return "已完善";
    case "in_progress":
      return "进行中";
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
  const allItems = groups.flatMap((group) => group.items);
  const readyCount = allItems.filter((item) => item.status === "ready").length;

  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar-summary">
        <div>
          <p className="editor-sidebar-label">模块导航</p>
          <strong>{readyCount}/{allItems.length} 已完善</strong>
        </div>
      </div>

      <div className="editor-sidebar-block">
        {groups.map((group) => (
          <section className="editor-sidebar-group" key={group.key}>
            <div className="editor-sidebar-group-head">
              <p className="editor-sidebar-group-label">{group.label}</p>
            </div>

            <div className="editor-sidebar-list">
              {group.items.map((item) => {
                const active = activePanel === item.key;
                const Icon = iconMap[item.key];

                return (
                  <button
                    aria-pressed={active}
                    className={`editor-sidebar-item ${active ? "editor-sidebar-item-active" : ""}`}
                    key={item.key}
                    onClick={() => onSelect(item.key)}
                    type="button"
                  >
                    <span className="editor-sidebar-item-index">
                      <Icon className="size-4" />
                    </span>
                    <div className="editor-sidebar-item-copy">
                      <div className="editor-sidebar-item-head">
                        <div className="editor-sidebar-item-titleline">
                          <strong>{item.label}</strong>
                          {item.countLabel ? <span className="editor-sidebar-item-note">{item.countLabel}</span> : null}
                        </div>
                        <span
                          aria-label={panelStatusLabel(item.status)}
                          className={`editor-sidebar-item-dot editor-sidebar-item-dot-${item.status}`}
                          title={panelStatusLabel(item.status)}
                        />
                      </div>
                      {active ? <span className="editor-sidebar-item-hint">{item.hint}</span> : null}
                    </div>
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
