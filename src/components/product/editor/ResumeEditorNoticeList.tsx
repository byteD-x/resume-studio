"use client";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export interface ResumeEditorNotice {
  key: string;
  badge: string;
  message: string;
  tone: "neutral" | "accent" | "success" | "warning";
  actionLabel?: string;
  onAction?: () => void;
}

export function ResumeEditorNoticeList({
  notices,
}: {
  notices: ResumeEditorNotice[];
}) {
  return (
    <>
      {notices.map((notice) => {
        const actionable = Boolean(notice.actionLabel && notice.onAction);

        return (
          <div
            className={`editor-compact-alert ${actionable ? "editor-compact-alert-actionable" : ""}`}
            key={notice.key}
            onClick={actionable ? notice.onAction : undefined}
            onKeyDown={
              actionable
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      notice.onAction?.();
                    }
                  }
                : undefined
            }
            role={actionable ? "button" : undefined}
            tabIndex={actionable ? 0 : undefined}
          >
            <Badge tone={notice.tone}>{notice.badge}</Badge>
            <span className="editor-compact-alert-text">{notice.message}</span>
            {notice.actionLabel && notice.onAction ? (
              <button
                className="editor-compact-alert-action"
                onClick={(event) => {
                  event.stopPropagation();
                  notice.onAction?.();
                }}
                type="button"
              >
                <span>{notice.actionLabel}</span>
                <ArrowRight className="size-3.5" />
              </button>
            ) : null}
          </div>
        );
      })}
    </>
  );
}
