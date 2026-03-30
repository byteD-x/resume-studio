"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/Button";
import { PageState } from "@/components/site/PageState";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageState
      badge="加载失败"
      title="页面暂时不可用"
      description="请稍后重试。"
      actions={
        <>
          <Button onClick={() => reset()} variant="secondary">
            重试
          </Button>
          <ButtonLink href="/">返回首页</ButtonLink>
        </>
      }
    />
  );
}
