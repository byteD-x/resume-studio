"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "secondary" | "ghost" | "danger";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  confirmVariant = "primary",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  const descriptionId = description ? "app-confirm-dialog-description" : undefined;

  return (
    <div className="app-dialog-overlay" onClick={onClose} role="presentation">
      <section
        aria-describedby={descriptionId}
        aria-labelledby="app-confirm-dialog-title"
        aria-modal="true"
        className={cn("app-dialog", "app-confirm-dialog")}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="alertdialog"
      >
        <div className="app-dialog-head">
          <div>
            <p className="app-dialog-kicker">请确认</p>
            <h2 className="app-dialog-title" id="app-confirm-dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="app-dialog-copy" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="关闭确认对话框"
            className="icon-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="app-dialog-actions">
          <Button onClick={onClose} variant="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={() => void onConfirm()} variant={confirmVariant}>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
