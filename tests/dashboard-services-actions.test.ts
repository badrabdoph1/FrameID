import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  package: {
    update: vi.fn(),
  },
}));

const sessionMock = vi.hoisted(() => ({
  getCurrentRequestSession: vi.fn(),
}));

const nextMock = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/auth/request-session", () => sessionMock);
vi.mock("next/navigation", () => ({ redirect: nextMock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: nextMock.revalidatePath }));

import { updatePackageAction } from "@/app/(dashboard)/dashboard/services/actions";

const session = {
  user: { id: "user-1" },
  tenant: { id: "tenant-1" },
  site: { id: "site-1", slug: "studio" },
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("dashboard services actions", () => {
  it("updates an existing package with edited price, title, status and filtered feature rows", async () => {
    sessionMock.getCurrentRequestSession.mockResolvedValue(session);
    prismaMock.package.update.mockResolvedValue({ id: "pkg-1" });

    const formData = new FormData();
    formData.set("id", "pkg-1");
    formData.set("name", "باقة التصوير الفاخر");
    formData.set("subtitle", "تغطية اليوم كامل");
    formData.set("priceAmount", "22,000");
    formData.set("currency", "EGP");
    formData.append("feature", "معالجة 250 صورة");
    formData.append("feature", "");
    formData.append("feature", "ألبوم مطبوع");
    formData.set("isHighlighted", "on");
    formData.set("isActive", "on");

    await expect(updatePackageAction(formData)).rejects.toThrow("NEXT_REDIRECT:/dashboard/services?updated=package");

    expect(prismaMock.package.update).toHaveBeenCalledWith({
      where: { id: "pkg-1", siteId: "site-1" },
      data: {
        name: "باقة التصوير الفاخر",
        subtitle: "تغطية اليوم كامل",
        priceAmount: 22000,
        currency: "EGP",
        features: ["معالجة 250 صورة", "ألبوم مطبوع"],
        isHighlighted: true,
        isActive: true,
      },
    });
    expect(nextMock.revalidatePath).toHaveBeenCalledWith("/dashboard/services");
    expect(nextMock.revalidatePath).toHaveBeenCalledWith("/p/studio");
  });
});
