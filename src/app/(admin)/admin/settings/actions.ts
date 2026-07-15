"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { processError } from "@/lib/errors";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";
import { readFormString } from "@/modules/auth/auth-action-utils";
import { normalizeEgyptianWhatsappNumber, saveSupportWhatsappNumber } from "@/modules/support/support-settings";
import { syncPlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

function redirectWithError(message: string): never {
  redirect(`/admin/settings?supportError=${encodeURIComponent(message)}`);
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
