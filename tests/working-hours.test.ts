import { describe, expect, it } from "vitest";

import { parseWorkingHoursFields } from "@/modules/dashboard/working-hours";

describe("working hours fields", () => {
  it("turns simple day rows into stored working hours without exposing JSON", () => {
    const formData = new FormData();
    formData.set("hours-saturday-enabled", "on");
    formData.set("hours-saturday-from", "09:00");
    formData.set("hours-saturday-to", "17:00");
    formData.set("hours-sunday-enabled", "off");
    formData.set("hours-monday-enabled", "on");
    formData.set("hours-monday-note", "حسب الحجز");

    expect(parseWorkingHoursFields(formData)).toEqual({
      السبت: "09:00 - 17:00",
      الأحد: "مغلق",
      الاثنين: "حسب الحجز",
      الثلاثاء: "مغلق",
      الأربعاء: "مغلق",
      الخميس: "مغلق",
      الجمعة: "مغلق"
    });
  });

  it("returns null when the form does not include working hour rows", () => {
    const formData = new FormData();
    formData.set("studioName", "Studio");

    expect(parseWorkingHoursFields(formData)).toBeNull();
  });
});
