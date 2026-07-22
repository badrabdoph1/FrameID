import { describe, expect, it } from "vitest";

import { parseSignupInput } from "@/modules/auth/signup-validation";

describe("signup validation", () => {
  it("normalizes email and preserves selected template", () => {
    const result = parseSignupInput({
      name: "  Ali Ahmed Studio  ",
      email: "  ALI@Example.COM ",
      password: "StrongPass123!",
      selectedTemplateCode: "noir-gold"
    });

    expect(result).toMatchObject({
      name: "Ali Ahmed Studio",
      email: "ali@example.com",
      password: "StrongPass123!",
      selectedTemplateCode: "noir-gold"
    });
  });

  it("rejects weak passwords before provisioning starts", () => {
    expect(() =>
      parseSignupInput({
        name: "Ali",
        email: "ali@example.com",
        password: "short"
      })
    ).toThrow(/كلمة المرور/);
  });
});
