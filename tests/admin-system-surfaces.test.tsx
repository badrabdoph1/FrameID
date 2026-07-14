import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("admin system surfaces", () => {
  it("keeps operations and system centers in Arabic", async () => {
    const [system, operations, jobs] = await Promise.all([
      readFile("src/app/(admin)/admin/system/page.tsx", "utf8"),
      readFile("src/app/(admin)/admin/operations/page.tsx", "utf8"),
      readFile("src/app/(admin)/admin/jobs/page.tsx", "utf8"),
    ]);
    expect(system).toContain('title="مركز النظام"');
    expect(operations).toContain('title="مركز العمليات"');
    expect(jobs).toContain('title="طابور المهام"');
  });

  it("does not leave analytics as a coming-soon page", async () => {
    const analytics = await readFile("src/app/(admin)/admin/analytics/page.tsx", "utf8");
    expect(analytics).not.toContain("قريبًا");
    expect(analytics).toContain("prisma.paymentRequest.aggregate");
    expect(analytics).toContain("تحليلات الزيارات والتحويل تتطلب نظام Analytics مستقلًا");
  });
});
