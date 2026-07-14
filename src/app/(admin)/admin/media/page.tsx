import { Image as ImageIcon } from "lucide-react";
import Image from "next/image";

import { AdminEmptyState } from "@/components/admin/admin-workspace-primitives";
import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

function formatSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ar-EG")} ك.ب` : `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} م.ب`; }

export default async function AdminMediaPage() {
  await requireAdminPermission("media", "view");
  const assets = await prisma.mediaAsset.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, url: true, storageKey: true, kind: true, mimeType: true, sizeBytes: true, width: true, height: true, alt: true, createdAt: true, tenant: { select: { id: true, displayName: true } } } });
  return (
    <AdminPageShell badge="المحتوى" title="مكتبة الوسائط" description="مرجع للملفات المرفوعة في مواقع العملاء. الرفع والتحرير يظلان داخل سياق الموقع أو القالب لمنع خلط الملكية." breadcrumbs={[{ label: "المحتوى", href: "/admin/content" }, { label: "الوسائط" }]}>
      <section aria-label="ملفات الوسائط" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {assets.length === 0 ? <div className="sm:col-span-2 xl:col-span-3"><AdminEmptyState title="لا توجد وسائط مرفوعة" description="ستظهر الصور والملفات هنا بعد رفعها من موقع العميل أو محرر القالب." icon={ImageIcon} /></div> : assets.map((asset) => <article key={asset.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"><a href={asset.url} target="_blank" rel="noreferrer" aria-label={`فتح ${asset.alt ?? asset.storageKey}`} className="relative block aspect-[16/10] bg-black/20">{asset.mimeType.startsWith("image/") ? <Image src={asset.url} alt={asset.alt ?? ""} fill unoptimized sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : <span className="grid size-full place-items-center"><ImageIcon className="size-9 text-white/20" /></span>}</a><div className="p-3"><h2 className="truncate text-sm font-black text-[#fff7e8]">{asset.alt ?? asset.storageKey.split("/").at(-1)}</h2><p className="mt-1 truncate text-xs font-bold text-white/42">{asset.tenant.displayName} · {asset.kind}</p><p className="mt-2 text-[0.68rem] font-bold text-white/32">{formatSize(asset.sizeBytes)}{asset.width && asset.height ? ` · ${asset.width}×${asset.height}` : ""}</p></div></article>)}
      </section>
    </AdminPageShell>
  );
}
