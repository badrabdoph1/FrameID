import { describe, expect, it } from "vitest";

import { classifyError } from "@/lib/errors";

function createPrismaUniqueError(target: string[]) {
  const error = new Error(
    `Unique constraint failed on the fields: (${target.join(",")})`
  ) as Error & {
    code: string;
    meta: { target: string[] };
    clientVersion: string;
  };

  error.name = "PrismaClientKnownRequestError";
  error.code = "P2002";
  error.meta = { target };
  error.clientVersion = "6.19.3";

  return error;
}

describe("error service", () => {
  it("classifies duplicate signup email as an auth conflict", () => {
    expect(classifyError(createPrismaUniqueError(["email"])).def.code).toBe(
      "FID-AUTH-002"
    );
  });

  it("classifies duplicate site slug as a site conflict", () => {
    expect(classifyError(createPrismaUniqueError(["slug"])).def.code).toBe(
      "FID-SITE-001"
    );
  });
});
