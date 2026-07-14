import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getPlatformBaseUrl } from "@/lib/platform-url";

describe("platform url", () => {
  it("uses the deployed platform URL as the metadata base for share images", () => {
    const rootLayout = readFileSync(
      `${process.cwd()}/src/app/layout.tsx`,
      "utf8",
    );

    expect(rootLayout).toContain('import { getPlatformBaseUrl } from "@/lib/platform-url"');
    expect(rootLayout).toContain("const seoBaseUrl = getPlatformBaseUrl()");
    expect(rootLayout).not.toContain('const seoBaseUrl = "https://frameid.app"');
  });

  it("normalizes and prefers the configured public app url", () => {
    expect(
      getPlatformBaseUrl({
        NEXT_PUBLIC_APP_URL: "https://frameid.app/",
        RAILWAY_PUBLIC_DOMAIN: "frameid-production.up.railway.app"
      })
    ).toBe("https://frameid.app");
  });

  it("uses the Railway public domain when the app url is not configured", () => {
    expect(
      getPlatformBaseUrl({
        RAILWAY_PUBLIC_DOMAIN: "frameid-production.up.railway.app"
      })
    ).toBe("https://frameid-production.up.railway.app");
  });

  it("uses a Vercel deployment domain when available", () => {
    expect(
      getPlatformBaseUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "frameid.vercel.app"
      })
    ).toBe("https://frameid.vercel.app");
  });

  it("skips invalid values and falls through to the next deployment domain", () => {
    expect(
      getPlatformBaseUrl({
        NEXT_PUBLIC_APP_URL: "not a valid host",
        VERCEL_URL: "frameid-preview.vercel.app"
      })
    ).toBe("https://frameid-preview.vercel.app");
  });

  it("falls back to localhost for local development only", () => {
    expect(getPlatformBaseUrl({})).toBe("http://localhost:3000");
  });
});
