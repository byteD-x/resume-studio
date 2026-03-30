import { ButtonLink } from "@/components/ui/Button";
import { PageState } from "@/components/site/PageState";

export default function NotFound() {
  return (
    <PageState
      badge="未找到"
      title="页面不存在"
      description="请返回首页或重新选择。"
      actions={
        <>
          <ButtonLink href="/" variant="secondary">
            返回首页
          </ButtonLink>
          <ButtonLink href="/templates">创建简历</ButtonLink>
        </>
      }
    />
  );
}
