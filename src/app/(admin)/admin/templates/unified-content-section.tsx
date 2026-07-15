import { getContent } from "@/lib/content";
import { UnifiedTemplateContentSchema } from "@/lib/content/schemas/templates";
import { UnifiedContentEditor } from "@/app/(admin)/admin/templates/unified-content-editor";
import type { z } from "zod";

type UnifiedContent = z.infer<typeof UnifiedTemplateContentSchema>;

export async function UnifiedContentSection() {
  let content: UnifiedContent | null = null;
  try {
    content = getContent("templates/unified-content") as unknown as UnifiedContent;
  } catch {
    return null;
  }

  return <UnifiedContentEditor content={content} />;
}
