"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
      {notices.map((notice) => (
        <div className="editor-compact-alert" key={notice.key}>
          <Badge tone={notice.tone}>{notice.badge}</Badge>
          <span className="editor-compact-alert-text">{notice.message}</span>
          {notice.actionLabel && notice.onAction ? (
            <Button className="editor-compact-alert-action" onClick={notice.onAction} variant="ghost">
              {notice.actionLabel}
            </Button>
          ) : null}
        </div>
      ))}
    </>
  );
}
