import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { can } from "@/modules/admin/admin-rbac";
import { getCurrentAdmin } from "@/modules/admin/admin-page-guards";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { findAccessibleCommunicationAttachment, type CommunicationAttachmentViewer } from "@/modules/communication-center/attachment-access";
import { createLocalCommunicationAttachmentStore } from "@/modules/communication-center/attachment-service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentRequestSession();
  let viewer: CommunicationAttachmentViewer | null = session
    ? { type: "CUSTOMER", tenantId: session.tenant.id }
    : null;

  if (!viewer) {
    const admin = await getCurrentAdmin();
    if (!admin || !can(admin.role, "support", "view")) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    viewer = { type: "ADMIN" };
  }

  const { id } = await params;
  const attachment = await findAccessibleCommunicationAttachment(prisma, id, viewer);
  if (!attachment) return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });

  const store = createLocalCommunicationAttachmentStore();
  if (attachment.storageProvider !== store.id) {
    return NextResponse.json({ error: "مزود التخزين غير متاح" }, { status: 503 });
  }
  try {
    const bytes = await store.read(attachment.storageKey);
    const safeName = attachment.originalName.replace(/[\r\n"\\]/g, "_");
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر قراءة المرفق" }, { status: 404 });
  }
}
