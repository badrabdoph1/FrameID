import type { ReactElement } from "react";
import type { PublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";
import { NoirGoldPresentation } from "./noir-gold-presentation";
import { RoseBlushSite } from "./rose-blush-site";

type ThemeSiteComponent = (props: { site: PublicSiteViewModel }) => ReactElement;

const registry: Record<string, ThemeSiteComponent> = {
  "noir-gold": NoirGoldPresentation,
  "rose-blush": RoseBlushSite,
};

export function getThemeSiteComponent(code: string): ThemeSiteComponent {
  return registry[code] ?? NoirGoldPresentation;
}
