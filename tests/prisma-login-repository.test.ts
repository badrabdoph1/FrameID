import { describe, expect, it } from "vitest";

import { createPrismaLoginRepository } from "@/modules/auth/prisma-login-repository";

describe("prisma login repository", () => {
  it("loads active users by identifier and stores hashed sessions", async () => {
    const calls: string[] = [];
    const prisma = {
      user: {
        async findFirst(args: unknown) {
          const input = args as { where: { OR: Array<{ email?: string; phone?: string }> } };
          const email = input.where.OR.find((item) => item.email)?.email ?? "";
          const phone = input.where.OR.find((item) => item.phone)?.phone ?? null;
          calls.push(`find:${email}:${phone ?? "none"}`);
          return {
            id: "user_1",
            email,
            phone,
            name: "Ali Ahmed",
            role: "USER",
            passwordHash: "hash"
          };
        }
      },
      session: {
        async create(args: {
          data: {
            userId: string;
            tokenHash: string;
            expiresAt: Date;
          };
          select: {
            id: true;
            userId: true;
            expiresAt: true;
          };
        }) {
          calls.push(`session:${args.data.userId}:${args.data.tokenHash}`);
          return {
            id: "session_1",
            userId: args.data.userId,
            expiresAt: args.data.expiresAt
          };
        }
      }
    };
    const repository = createPrismaLoginRepository(prisma);

    await expect(
      repository.findUserByIdentifier({ email: "ali@example.com", phone: null })
    ).resolves.toEqual({
      id: "user_1",
      email: "ali@example.com",
      phone: null,
      name: "Ali Ahmed",
      role: "USER",
      passwordHash: "hash"
    });
    await expect(
      repository.createSession({
        userId: "user_1",
        tokenHash: "hashed-token",
        expiresAt: new Date("2026-08-05T12:00:00.000Z")
      })
    ).resolves.toEqual({
      id: "session_1",
      userId: "user_1",
      expiresAt: new Date("2026-08-05T12:00:00.000Z")
    });

    expect(calls).toEqual([
      "find:ali@example.com:none",
      "session:user_1:hashed-token"
    ]);
  });
});
