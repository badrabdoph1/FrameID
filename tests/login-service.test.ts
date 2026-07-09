import { describe, expect, it } from "vitest";

import { createLoginService, type LoginRepository } from "@/modules/auth/login-service";
import { hashPassword } from "@/modules/auth/password-hashing";

function createRepository(passwordHash: string): LoginRepository & {
  calls: string[];
  storedTokenHash?: string;
} {
  const calls: string[] = [];

  return {
    calls,
    async findUserByIdentifier({ email, phone }) {
      calls.push(`find:${email}:${phone ?? "none"}`);

      if (email !== "ali@example.com" && phone !== "+201000000000") {
        return null;
      }

      return {
        id: "user_1",
        email,
        phone,
        name: "Ali Ahmed",
        passwordHash,
        role: "USER"
      };
    },
    async createSession(input) {
      calls.push(`session:${input.userId}`);
      this.storedTokenHash = input.tokenHash;

      return {
        id: "session_1",
        userId: input.userId,
        expiresAt: input.expiresAt
      };
    }
  };
}

describe("login service", () => {
  it("verifies credentials and creates a hashed session", async () => {
    const passwordHash = await hashPassword("StrongPass123!");
    const repository = createRepository(passwordHash);
    const service = createLoginService({
      repository,
      now: () => new Date("2026-07-06T12:00:00.000Z")
    });

    const result = await service.login({
      identifier: "  ALI@Example.COM ",
      password: "StrongPass123!"
    });

    expect(repository.calls).toEqual(["find:ali@example.com:none", "session:user_1"]);
    expect(result.user).toEqual({
      id: "user_1",
      email: "ali@example.com",
      phone: null,
      name: "Ali Ahmed",
      role: "USER"
    });
    expect(result.session.cookie.value).not.toBe(repository.storedTokenHash);
    expect(result.session.expiresAt.toISOString()).toBe("2026-08-05T12:00:00.000Z");
  });

  it("rejects invalid credentials without creating a session", async () => {
    const passwordHash = await hashPassword("StrongPass123!");
    const repository = createRepository(passwordHash);
    const service = createLoginService({ repository });

    await expect(
      service.login({
        identifier: "ali@example.com",
        password: "WrongPass123!"
      })
    ).rejects.toThrow("Invalid phone/email or password");

    expect(repository.calls).toEqual(["find:ali@example.com:none"]);
  });
});
