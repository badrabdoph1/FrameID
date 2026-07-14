import { describe, expect, it } from "vitest";

import { getJourneyMoments } from "@/components/public-journey/journey-config";

describe("public living journey config", () => {
  it("maps each public funnel route to the next-action moment", () => {
    expect(getJourneyMoments("/").map((moment) => moment.id)).toEqual(["home-start"]);
    expect(getJourneyMoments("/templates").map((moment) => moment.id)).toEqual(["templates-pick"]);
    expect(getJourneyMoments("/templates/noir-gold/preview").map((moment) => moment.id)).toEqual([
      "preview-real",
      "preview-use",
    ]);
    expect(getJourneyMoments("/signup").map((moment) => moment.id)).toEqual(["signup-create"]);
    expect(getJourneyMoments("/login")).toEqual([]);
  });

  it("keeps one calm FrameID voice and points to an action", () => {
    const moments = [
      ...getJourneyMoments("/"),
      ...getJourneyMoments("/templates"),
      ...getJourneyMoments("/templates/noir-gold/preview"),
      ...getJourneyMoments("/signup"),
    ];

    expect(moments).toHaveLength(5);
    expect(moments.every((moment) => moment.copy.length <= 2)).toBe(true);
    expect(moments.every((moment) => ["تمام", "فهمت"].includes(moment.dismissLabel))).toBe(true);
    expect(moments.find((moment) => moment.id === "home-start")?.copy).toEqual([
      "ابدأ من هنا.",
      "اختار شكل موقعك، وبعدها هنجهزه باسمك.",
    ]);
    expect(moments.find((moment) => moment.id === "templates-pick")?.personality).toBe("prism");
    expect(moments.find((moment) => moment.id === "preview-real")?.personality).toBe("screen");
    expect(moments.find((moment) => moment.id === "preview-use")?.trigger).toBe("preview-progress");
  });
});
