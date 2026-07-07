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

  it("maps internal auth errors to safe user-facing messages", () => {
    expect(getAuthActionErrorMessage(new Error("Email already exists"))).toBe(
      "هذا البريد مستخدم بالفعل."
    );
    expect(getAuthActionErrorMessage(new Error("Invalid email or password"))).toBe(
      "البريد أو كلمة المرور غير صحيحة."
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
    ).toBe("راجع البيانات وحاول مرة أخرى.");
    expect(
      getAuthActionErrorMessage(
        new Error("Can't reach database server at `localhost:5432`")
      )
    ).toBe(
      "قاعدة البيانات غير متصلة حاليًا. تأكد من DATABASE_URL وتشغيل قاعدة البيانات ثم حاول مرة أخرى."
    );
    expect(
      getAuthActionErrorMessage(
        new Error("Environment variable not found: DATABASE_URL")
      )
    ).toBe(
      "قاعدة البيانات غير متصلة حاليًا. تأكد من DATABASE_URL وتشغيل قاعدة البيانات ثم حاول مرة أخرى."
    );
  });
});
