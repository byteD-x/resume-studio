import { ButtonLink } from "@/components/ui/Button";
import { PageState } from "@/components/site/PageState";

export default function ResumeNotFound() {
  return (
    <PageState
      badge="简历不存在"
      title="没有找到这份简历"
      description="它可能已被删除，或链接无效。"
      actions={
        <>
          <ButtonLink href="/templates">新建简历</ButtonLink>
          <ButtonLink href="/resumes" variant="secondary">
            我的简历
          </ButtonLink>
        </>
      }
    />
  );
}
