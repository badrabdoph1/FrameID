import { describe, expect, it } from "vitest";

import { verifyPassword } from "@/modules/auth/password-hashing";
import {
  seedSuperAdminUser,
  type SuperAdminSeedRepository
} from "@/modules/setup/super-admin-seed-service";

describe("super admin seed service", () => {
  it("normalizes the seed email and writes the provided password hash", async () => {
    let seededInput:
      | {
          email: string;
          name: string;
          passwordHash: string;
        }
      | undefined;
    const repository: SuperAdminSeedRepository = {
      async upsertSuperAdmin(input) {
        seededInput = input;
      }
    };

    await expect(
      seedSuperAdminUser({
        repository,
        email: "  ADMIN@Example.COM ",
        password: "NewStrongPass123!"
      })
    ).resolves.toBe("seeded");

    expect(seededInput?.email).toBe("admin@example.com");
    expect(seededInput?.name).toBe("FrameID Admin");
    expect(seededInput?.passwordHash).toMatch(/^scrypt\$/);
    await expect(
      verifyPassword("NewStrongPass123!", seededInput?.passwordHash ?? "")
    ).resolves.toBe(true);
  });

  it("skips seeding when the bootstrap credentials are incomplete", async () => {
    const repository: SuperAdminSeedRepository = {
      async upsertSuperAdmin() {
        throw new Error("should not seed without credentials");
      }
    };

    await expect(
      seedSuperAdminUser({
        repository,
        email: "admin@example.com",
        password: ""
      })
    ).resolves.toBe("skipped");
  });
});
