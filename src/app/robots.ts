import type { MetadataRoute } from "next";

const siteUrl = "https://frameid.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard"]
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
