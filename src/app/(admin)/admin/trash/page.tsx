import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div style={{ padding: "2rem", color: "white", backgroundColor: "#1a1a1a" }}>
      <h1>Trash Test Page - Step 2</h1>
      <p>✅ prisma import OK</p>
      <p>✅ getCurrentAdmin import OK</p>
      <p>✅ redirect import OK</p>
      <p>✅ Admin check passed</p>
      <p>Logged in as: {admin.name}</p>
    </div>
  );
}
