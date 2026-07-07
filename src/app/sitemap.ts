import type { MetadataRoute } from "next";

const siteUrl = "https://frameid.app";

const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "daily" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/templates", priority: 0.9, changeFrequency: "daily" },
  { path: "/signup", priority: 0.8, changeFrequency: "monthly" },
  { path: "/login", priority: 0.6, changeFrequency: "monthly" },
  { path: "/forgot-password", priority: 0.3, changeFrequency: "monthly" },
  { path: "/reset-password", priority: 0.3, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.4, changeFrequency: "monthly" }
];

const publishedTemplateCodes = ["noir-gold"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-07T00:00:00.000Z");

  const staticUrls = staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const templatePreviewUrls = publishedTemplateCodes.map((code) => ({
    url: `${siteUrl}/templates/${code}/preview`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.5
  }));

  return [...staticUrls, ...templatePreviewUrls];
}
