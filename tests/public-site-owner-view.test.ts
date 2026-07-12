import { describe, expect, it } from "vitest";

import { shouldShowOwnerView } from "@/modules/public-sites/owner-view";

describe("public site owner view", () => {
  it("shows the owner context only for the requested site owned by the session", () => {
    expect(
      shouldShowOwnerView({
        requested: true,
        requestedSlug: "ali",
        sessionSiteSlug: "ali"
      })
    ).toBe(true);

    expect(
      shouldShowOwnerView({
        requested: false,
        requestedSlug: "ali",
        sessionSiteSlug: "ali"
      })
    ).toBe(false);

    expect(
      shouldShowOwnerView({
        requested: true,
        requestedSlug: "ali",
        sessionSiteSlug: null
      })
    ).toBe(false);

    expect(
      shouldShowOwnerView({
        requested: true,
        requestedSlug: "ali",
        sessionSiteSlug: "mona"
      })
    ).toBe(false);
  });
});
