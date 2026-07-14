"use server";

import { revalidatePath } from "next/cache";
import { saveContent } from "@/lib/content";
import type { ContentSchemaKey, SaveResult } from "@/lib/content";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export async function saveContentAction(
  type: ContentSchemaKey,
  data: unknown
): Promise<SaveResult> {
  const admin = await requireAdminPermission("content", "edit");
  if (type === "marketing/homepage" || type === "marketing/faq") {
    return {
      success: false,
      errors: [{ path: "general", message: "هذه الصفحة تُحرر الآن مباشرة من مساحة الصفحة الرئيسية." }],
    };
  }
  const result = await saveContent(type, data, {
    actor: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
    },
  });
  if (result.success) {
    revalidatePath(`/admin/content/${type.replace("/", "/")}`);
    revalidatePath("/admin/revisions");
    revalidatePath("/");
  }
  return result;
}

export type { ContentSchemaKey, SaveResult };
