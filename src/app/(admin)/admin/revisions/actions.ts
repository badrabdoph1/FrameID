"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { saveContent, ContentSchemas, type ContentSchemaKey } from "@/lib/content";
import { getContentRevisionById } from "@/lib/content/revisions";
import { processError } from "@/lib/errors";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { restorePlatformConfigurationToGitHub } from "@/modules/setup/platform-configuration-git";

export async function restoreRevisionAction(formData: FormData) {
  const admin = await requireAdminPermission("content", "edit");
  const revisionId = String(formData.get("revisionId") ?? "");
  const revision = await getContentRevisionById(revisionId);
  if (!revision || revision.before === null || revision.before === undefined) redirect("/admin/revisions?error=الإصدار السابق غير متاح");

  try {
    if (revision.type.startsWith("platform/")) {
      await restorePlatformConfigurationToGitHub({ value: revision.before, actor: admin, sourceRevisionId: revision.id });
    } else if (revision.type in ContentSchemas) {
      const result = await saveContent(revision.type as ContentSchemaKey, revision.before, { actor: admin });
      if (!result.success) throw new Error(result.errors.map((item) => item.message).join("؛ "));
    } else {
      throw new Error("نوع هذا الإصدار لم يعد مدعومًا");
    }
  } catch (error) {
    const { userError } = await processError(error, { metadata: { action: "restoreRevision", revisionId } });
    redirect(`/admin/revisions?error=${encodeURIComponent(userError.message)}`);
  }
  revalidatePath("/admin/revisions");
  revalidatePath("/", "layout");
  redirect("/admin/revisions?restored=1");
}
