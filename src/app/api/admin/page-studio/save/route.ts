import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export async function POST() {
  await requireAdminPermission("content", "edit");
  return Response.json(
    {
      success: false,
      errors: [{ path: "general", message: "انتقل تحرير الصفحات إلى قسم المحتوى الجديد." }],
    },
    { status: 410 },
  );
}
