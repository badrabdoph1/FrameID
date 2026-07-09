import type { MetadataRoute } from "next";

const siteUrl = "https://frameid.app";

const staticRoutes: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "daily" }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/templates", priority: 0.85, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.35, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.35, changeFrequency: "monthly" },
  { path: "/cookies", priority: 0.3, changeFrequency: "monthly" }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-09T00:00:00.000Z");

  return staticRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
