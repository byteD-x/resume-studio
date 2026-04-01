// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

describe("confirm dialog", () => {
  it("locks the dialog while async confirm is running", async () => {
    let releaseConfirm: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseConfirm = () => resolve();
        }),
    );
    const onClose = vi.fn();

    render(
      <ConfirmDialog
        confirmLabel="删除"
        description="确认后会删除当前简历。"
        onClose={onClose}
        onConfirm={onConfirm}
        open
        title="删除确认"
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "删除" });
    const cancelButton = screen.getByRole("button", { name: "取消" });
    const closeButton = screen.getByRole("button", { name: "关闭确认对话框" });

    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect((confirmButton as HTMLButtonElement).disabled).toBe(true);
      expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
      expect((closeButton as HTMLButtonElement).disabled).toBe(true);
    });

    fireEvent.click(confirmButton);
    fireEvent.click(cancelButton);
    fireEvent.keyDown(window, { key: "Escape" });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    releaseConfirm?.();

    await waitFor(() => {
      expect((confirmButton as HTMLButtonElement).disabled).toBe(false);
    });
  });
});
