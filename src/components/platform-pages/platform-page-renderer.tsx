import type { ComponentType, ReactNode } from "react";

import {
  HomePageRenderer,
  type EditableImageField,
  type EditableTextField,
  type FeaturedTemplatePreview,
} from "@/components/marketing/home-page-renderer";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";

export type PlatformPageRendererProps = {
  definitionKey: string;
  document: PlatformPageDocument;
  featuredTemplate?: FeaturedTemplatePreview | null;
  renderText?: (field: EditableTextField) => ReactNode;
  renderImage?: (field: EditableImageField, image: ReactNode) => ReactNode;
};

type RegisteredRendererProps = Omit<PlatformPageRendererProps, "definitionKey">;

const PAGE_RENDERERS: Record<string, ComponentType<RegisteredRendererProps>> = {
  home: HomePageRenderer,
};

export function hasPlatformPageRenderer(pageKey: string): boolean {
  return pageKey in PAGE_RENDERERS;
}

export function PlatformPageRenderer({ definitionKey, ...props }: PlatformPageRendererProps) {
  const Renderer = PAGE_RENDERERS[definitionKey];
  if (!Renderer) {
    throw new Error(`لا يوجد عارض مسجل للصفحة: ${definitionKey}`);
  }

  return <Renderer {...props} />;
}
