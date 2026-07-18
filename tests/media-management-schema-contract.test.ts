import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
const migration = readFileSync(
  join(process.cwd(), "prisma/migrations/20260718160000_media_management_operations/migration.sql"),
  "utf8",
);

describe("media management schema contract", () => {
  it("declares persistent operation framework models and statuses", () => {
    expect(schema).toContain("enum OperationStatus");
    expect(schema).toContain("enum OperationType");
    expect(schema).toContain("model Operation");
    expect(schema).toContain("model OperationEvent");
    expect(schema).toContain("model OperationItem");
    expect(schema).toContain("leaseExpiresAt");
    expect(schema).toContain("checkpoint");
  });

  it("declares media catalog lifecycle, references, findings and settings", () => {
    expect(schema).toContain("enum MediaLifecycleStatus");
    expect(schema).toContain("enum MediaUsageStatus");
    expect(schema).toContain("model MediaCatalogEntry");
    expect(schema).toContain("model MediaReference");
    expect(schema).toContain("model MediaFinding");
    expect(schema).toContain("model MediaLifecycleEvent");
    expect(schema).toContain("model MediaSettings");
    expect(schema).toContain("purgeEligibleAt");
  });

  it("ships a migration for the persistent operation and media catalog tables", () => {
    expect(migration).toContain('CREATE TYPE "OperationStatus"');
    expect(migration).toContain('CREATE TABLE "Operation"');
    expect(migration).toContain('CREATE TABLE "MediaCatalogEntry"');
    expect(migration).toContain('CREATE TABLE "MediaLifecycleEvent"');
  });
});
