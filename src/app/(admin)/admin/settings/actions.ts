"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { SERVICES_PLATFORM_UI_FEATURE_KEY, setServicesPlatformUiVisible } from "@/modules/services-platform/ui-visibility";
import { normalizeEgyptianWhatsappNumber, saveSupportWhatsappNumber } from "@/modules/support/support-settings";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

function redirectWithError(message: string): never {
  redirect(`/admin/settings?supportError=${encodeURIComponent(message)}`);
}

export async function updateServicesPlatformVisibilityAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const enabled = formData.get("servicesPlatformVisible") === "on";

  try {
    await setServicesPlatformUiVisible(prisma, enabled);
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: enabled ? "SERVICES_PLATFORM_UI_ENABLED" : "SERVICES_PLATFORM_UI_DISABLED",
        entityType: "FeatureFlag",
        metadata: {
          key: SERVICES_PLATFORM_UI_FEATURE_KEY,
          enabled,
          adminId: session.user.id,
          adminEmail: session.user.email,
        },
      },
    });
    await syncPlatformConfigurationToGitHub({ actor: session.user, reason: enabled ? "إظهار منصة الخدمات" : "إخفاء منصة الخدمات" });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "updateServicesPlatformVisibility", enabled },
    });
    redirect(`/admin/settings?servicesVisibilityError=${encodeURIComponent(userError.message)}`);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard", "layout");
  revalidatePath("/admin/settings");
  redirect(`/admin/settings?servicesVisibilitySaved=${enabled ? "visible" : "hidden"}`);
}

export async function updateSupportWhatsappAction(formData: FormData) {
  const session = await requireSuperAdminSession();
  const phone = normalizeEgyptianWhatsappNumber(readFormString(formData, "supportWhatsapp"));

  if (!/^01[0125][0-9]{8}$/u.test(phone)) {
    redirectWithError("رقم واتساب غير صحيح. اكتب رقم مصري مثل 01038434472.");
  }

  try {
    const savedPhone = await saveSupportWhatsappNumber(phone);
    const admin = session.user;
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
        action: "SUPPORT_WHATSAPP_UPDATED",
        entityType: "FeatureFlag",
        metadata: {
          phone: savedPhone,
          adminId: admin.id,
          adminEmail: admin.email,
        },
      },
    });
    await syncPlatformConfigurationToGitHub({ actor: session.user, reason: "تعديل رقم دعم المنصة" });
  } catch (error) {
    const { userError } = await processError(error, {
      metadata: { action: "updateSupportWhatsapp", phone },
    });
    redirectWithError(userError.message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/api/support-settings");
  redirect("/admin/settings?supportSaved=1");
}
