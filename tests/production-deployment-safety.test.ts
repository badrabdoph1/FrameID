import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production deployment safety", () => {
  it("repairs legacy payment request logs before Prisma pushes the schema", () => {
    const packageJson = JSON.parse(
      readFileSync(`${process.cwd()}/package.json`, "utf8"),
    ) as { scripts: Record<string, string> };
    const deployScript = packageJson.scripts["db:deploy:safe"];
    const repairMigration =
      "20260714120000_prepare_payment_request_logs_for_push/migration.sql";

    expect(deployScript).toContain(repairMigration);
    expect(deployScript.indexOf(repairMigration)).toBeLessThan(
      deployScript.indexOf("prisma db push"),
    );
    expect(deployScript).not.toContain("--force-reset");
  });
});
