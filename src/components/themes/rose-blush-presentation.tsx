import { UnifiedTemplatePresentation } from "@/components/themes/unified-template-presentation";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

export function RoseBlushPresentation({ site }: { site: PublicSiteViewModel }) {
  return <UnifiedTemplatePresentation site={site} variant="rose" />;
}
