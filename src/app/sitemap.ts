import type { MetadataRoute } from "next";

const siteUrl = "https://frameid.app";

const publicRoutes = ["", "/templates", "/signup", "/login", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-07-07T00:00:00.000Z");

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7
  }));
}
