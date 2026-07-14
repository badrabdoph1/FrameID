import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export async function GET() {
  await requireAdminPermission("content", "view");
  return Response.json(
    { success: false, error: "انتقل محرر الصفحات إلى قسم المحتوى الجديد." },
    { status: 410 },
  );
}
