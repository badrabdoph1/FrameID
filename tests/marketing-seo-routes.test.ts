import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("marketing SEO routes", () => {
  it("allows public marketing pages and points crawlers to the sitemap", () => {
    const rules = robots();

    expect(rules.rules).toMatchObject({
      userAgent: "*",
      allow: "/"
    });
    expect(rules.sitemap).toBe("https://frameid.app/sitemap.xml");
  });

  it("lists the primary public pages in the sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        "https://frameid.app",
        "https://frameid.app/templates",
      ])
    );
    expect(urls.length).toBeGreaterThanOrEqual(3);
    expect(entries.every((entry) => entry.lastModified instanceof Date)).toBe(true);
  });
});
