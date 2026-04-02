import type { Metadata } from "next";
import { TemplateGalleryPage } from "@/components/product/TemplateGalleryPage";
import { requireAuthContext } from "@/lib/auth/dal";

export const metadata: Metadata = {
  title: "模板",
  description: "选择一个版式开始。",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireAuthContext("/templates");
  return <TemplateGalleryPage />;
}
