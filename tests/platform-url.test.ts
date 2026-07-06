import { describe, expect, it } from "vitest";

import { getPlatformBaseUrl } from "@/lib/platform-url";

describe("platform url", () => {
  it("normalizes the configured public app url", () => {
    expect(getPlatformBaseUrl({ NEXT_PUBLIC_APP_URL: "https://frameid.app/" })).toBe(
      "https://frameid.app"
    );
  });

  it("falls back to localhost for local development only", () => {
    expect(getPlatformBaseUrl({})).toBe("http://localhost:3000");
  });
});
