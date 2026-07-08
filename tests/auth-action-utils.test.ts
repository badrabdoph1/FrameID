import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  getAuthActionErrorMessage,
  readFormString
} from "@/modules/auth/auth-action-utils";

describe("auth action utils", () => {
  it("reads form values as strings and ignores file payloads", () => {
    const formData = new FormData();
    formData.set("email", "ali@example.com");
    formData.set("avatar", new File(["x"], "avatar.jpg"));

    expect(readFormString(formData, "email")).toBe("ali@example.com");
    expect(readFormString(formData, "avatar")).toBe("");
    expect(readFormString(formData, "missing")).toBe("");
  });

  it("reads React server action prefixed form fields", () => {
    const formData = new FormData();
    formData.set("_1_email", "ali@example.com");
    formData.set("_1_password", "StrongPass123");
    formData.set("_1_avatar", new File(["x"], "avatar.jpg"));

    expect(readFormString(formData, "email")).toBe("ali@example.com");
    expect(readFormString(formData, "password")).toBe("StrongPass123");
    expect(readFormString(formData, "avatar")).toBe("");
  });

  it("maps internal auth errors to safe user-facing messages", () => {
    expect(getAuthActionErrorMessage(new Error("Email already exists"))).toBe(
      "البريد دا مستخدم قبل كده."
    );
    expect(getAuthActionErrorMessage(new Error("Invalid email or password"))).toBe(
      "البريد أو كلمة السر غلط."
    );
    expect(
      getAuthActionErrorMessage(
        new ZodError([
          {
            code: "custom",
            path: ["password"],
            message: "Password is weak"
          }
        ])
      )
    ).toBe("راجع البيانات وجرب تاني.");
    expect(
      getAuthActionErrorMessage(
        new Error("Can't reach database server at `localhost:5432`")
      )
    ).toBe(
      "قاعدة البيانات مش متصلة دلوقتي. تأكد من DATABASE_URL وشغل قاعدة البيانات وجرب تاني."
    );
    expect(
      getAuthActionErrorMessage(
        new Error("Environment variable not found: DATABASE_URL")
      )
    ).toBe(
      "قاعدة البيانات مش متصلة دلوقتي. تأكد من DATABASE_URL وشغل قاعدة البيانات وجرب تاني."
    );
  });
});
