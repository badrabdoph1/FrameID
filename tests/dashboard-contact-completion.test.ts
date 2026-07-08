import { describe, expect, it } from "vitest";

import { hasMeaningfulContactInfo } from "@/modules/dashboard/contact-completion";

describe("dashboard contact completion", () => {
  it("does not mark contact info complete for an empty profile row", () => {
    expect(
      hasMeaningfulContactInfo({
        phone: null,
        whatsapp: null,
        email: null,
        city: null,
        country: null,
        address: null,
      }),
    ).toBe(false);
  });

  it("requires a contact channel and a location hint", () => {
    expect(
      hasMeaningfulContactInfo({
        phone: "+201000000000",
        whatsapp: null,
        email: null,
        city: "Cairo",
        country: null,
        address: null,
      }),
    ).toBe(true);

    expect(
      hasMeaningfulContactInfo({
        phone: "+201000000000",
        whatsapp: null,
        email: null,
        city: null,
        country: null,
        address: null,
      }),
    ).toBe(false);
  });
});
