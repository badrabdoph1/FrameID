import { afterEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  plan: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

const permissionMock = vi.hoisted(() => ({
  requireAdminPermission: vi.fn(),
}));

const syncMock = vi.hoisted(() => ({
  syncPlatformConfigurationToGitHub: vi.fn(),
}));

const errorMock = vi.hoisted(() => ({
  processError: vi.fn(),
}));

const nextMock = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/admin/admin-permission-guards", () => permissionMock);
vi.mock("@/modules/setup/platform-configuration-git", () => syncMock);
vi.mock("@/lib/errors", () => errorMock);
vi.mock("next/navigation", () => ({ redirect: nextMock.redirect }));
vi.mock("next/cache", () => ({ revalidatePath: nextMock.revalidatePath }));

import { savePlanAction } from "@/app/(admin)/admin/plans/actions";

const admin = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin",
  role: "SUPER_ADMIN",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("admin plan actions", () => {
  it("keeps an edited plan saved when platform configuration sync fails", async () => {
    permissionMock.requireAdminPermission.mockResolvedValue(admin);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    prismaMock.plan.findUnique.mockResolvedValueOnce({ id: "plan-1", code: "basic" });
    prismaMock.plan.update.mockResolvedValue({ id: "plan-1", code: "basic" });
    prismaMock.auditLog.create.mockResolvedValue({});
    syncMock.syncPlatformConfigurationToGitHub.mockRejectedValue(new Error("revision table unavailable"));
    errorMock.processError.mockResolvedValue({
      userError: { message: "حدث خطأ غير متوقع. حاول مرة أخرى." },
    });

    const formData = new FormData();
    formData.set("id", "plan-1");
    formData.set("code", "basic");
    formData.set("name", "الباقة الأساسية المطورة");
    formData.set("priceAmount", "899");
    formData.set("currency", "egp");
    formData.set("billingInterval", "monthly");
    formData.set("sortOrder", "2");
    formData.set("isActive", "true");
    formData.set("description", "وصف معدل");
    formData.append("featureLines", "ميزة جديدة");
    formData.append("featureLines", "");
    formData.append("featureLines", "ميزة ثانية");

    await expect(savePlanAction(formData)).rejects.toThrow("NEXT_REDIRECT:/admin/plans?saved=1");

    expect(prismaMock.plan.update).toHaveBeenCalledWith({
      where: { id: "plan-1" },
      data: expect.objectContaining({
        code: "basic",
        name: "الباقة الأساسية المطورة",
        priceAmount: 899,
        currency: "EGP",
        billingInterval: "monthly",
        isActive: true,
        sortOrder: 2,
        features: expect.objectContaining({
          description: "وصف معدل",
          featureLines: ["ميزة جديدة", "ميزة ثانية"],
        }),
      }),
    });
    expect(errorMock.processError).not.toHaveBeenCalled();
    expect(nextMock.revalidatePath).toHaveBeenCalledWith("/admin/plans");
    warn.mockRestore();
  });
});
