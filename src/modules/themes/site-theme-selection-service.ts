import type { CurrentSession } from "@/modules/auth/current-session-service";
import type {
  TemplateSummary,
  ThemeDefinition
} from "@/modules/themes/theme-registry";
import { getTemplateByCode, themeRegistry } from "@/modules/themes/theme-registry";

export type SiteThemeSelectionRepository = {
  applyTemplate(input: {
    siteId: string;
    theme: ThemeDefinition;
    template: TemplateSummary;
  }): Promise<void>;
};

export function createSiteThemeSelectionService({
  repository
}: {
  repository: SiteThemeSelectionRepository;
}) {
  return {
    async selectTemplate(input: {
      session: CurrentSession;
      templateCode: string;
    }): Promise<{ themeCode: string; templateCode: string }> {
      const template = getTemplateByCode(input.templateCode);

      if (!template || template.status !== "published") {
        throw new Error("Selected template is not available");
      }

      const theme = themeRegistry.getTheme(template.themeCode);

      if (!theme || theme.status !== "published") {
        throw new Error("Selected template is not available");
      }

      await repository.applyTemplate({
        siteId: input.session.site.id,
        theme,
        template
      });

      return {
        themeCode: theme.code,
        templateCode: template.code
      };
    }
  };
}
