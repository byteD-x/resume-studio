import type { Metadata } from "next";
import { TemplateGalleryPage } from "@/components/product/TemplateGalleryPage";

export const metadata: Metadata = {
  title: "模板",
  description: "选择一个版式开始。",
};

export default function TemplatesPage() {
  return <TemplateGalleryPage />;
}
