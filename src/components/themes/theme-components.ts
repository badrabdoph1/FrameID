import type { ReactElement } from "react";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { LuxeStudioSite } from "./luxe-studio-site";
import { NoirGoldPresentation } from "./noir-gold-presentation";
import { PrestigePresentation } from "./prestige-presentation";
import { RoseBlushSite } from "./rose-blush-site";

type ThemeSiteComponent = (props: { site: PublicSiteViewModel }) => ReactElement;

const registry: Record<string, ThemeSiteComponent> = {
  "noir-gold": NoirGoldPresentation,
  "rose-blush": RoseBlushSite,
  "luxe-studio": LuxeStudioSite,
  "prestige": PrestigePresentation,
};

export function getThemeSiteComponent(code: string): ThemeSiteComponent {
  return registry[code] ?? NoirGoldPresentation;
}
