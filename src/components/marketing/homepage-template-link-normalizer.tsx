"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const HOMEPAGE_TEMPLATE_CTA_TEXTS = [
  "شوف مثال لموقع مصور",
  "شاهد مثال لموقع مصور",
];

function isHomepageTemplatePreviewHref(href: string | null) {
  if (!href) return false;
  return /^\/templates\/[^/]+\/preview(?:$|[?#])/u.test(href);
}

function shouldNormalizeLink(anchor: HTMLAnchorElement) {
  const label = anchor.textContent?.replace(/\s+/gu, " ").trim() ?? "";
  if (!HOMEPAGE_TEMPLATE_CTA_TEXTS.some((text) => label.includes(text))) return false;
  return isHomepageTemplatePreviewHref(anchor.getAttribute("href"));
}

export function HomepageTemplateLinkNormalizer() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname !== "/") return;

    const normalizeAnchors = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/templates/"][href*="/preview"]').forEach((anchor) => {
        if (shouldNormalizeLink(anchor)) {
          anchor.setAttribute("href", "/templates");
        }
      });
    };

    normalizeAnchors();
    const observer = new MutationObserver(normalizeAnchors);
    observer.observe(document.body, { childList: true, subtree: true });

    const handleClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a");
      if (!anchor || !shouldNormalizeLink(anchor)) return;
      event.preventDefault();
      router.push("/templates");
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("click", handleClick, true);
    };
  }, [pathname, router]);

  return null;
}
