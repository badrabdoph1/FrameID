import { UnifiedTemplatePresentation } from "@/components/themes/unified-template-presentation";
import { NoirPackagesSection } from "@/components/themes/noir-packages-section";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

export function NoirGoldPresentation({ site }: { site: PublicSiteViewModel }) {
  return <UnifiedTemplatePresentation site={site} variant="noir" customPackagesSection={NoirPackagesSection} />;
}
