import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Boxes,
  Brush,
  ExternalLink,
  Flag,
  Globe,
  Image,
  Layers3,
  PackageCheck,
  Search,
  ShieldCheck,
} from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function dateLabel(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function domainTone(status: string): string {
  if (status === "VERIFIED") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (status === "FAILED") return "border-red-500/25 bg-red-500/10 text-red-300";
  return "border-amber-500/20 bg-amber-500/10 text-amber-200";
}

export default async function AdminSiteWorkspacePage({ params }: Props) {
  await requireAdminPermission("sites", "view");
  const { id } = await params;

  const site = await prisma.site.findUnique({
    where: { id },
    include: {
      tenant: { select: { id: true, displayName: true, status: true, owner: { select: { name: true, email: true } } } },
      theme: { select: { id: true, code: true, name: true, status: true, category: true, version: true } },
      domains: { where: { deletedAt: null }, orderBy: { createdAt: "desc" } },
      themeConfig: true,
      sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      packages: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      extras: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      albums: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" }, include: { images: { where: { deletedAt: null }, take: 3 } } },
      contact: true,
      seoSettings: true,
      featureFlags: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!site || site.deletedAt) notFound();

  const [mediaCount, auditCount, notificationCount] = await Promise.all([
    prisma.mediaAsset.count({ where: { deletedAt: null, tenantId: site.tenantId } }),
    prisma.auditLog.count({ where: { OR: [{ entityId: site.id }, { tenantId: site.tenantId }] } as never }),
    prisma.notificationLog.count({ where: { deletedAt: null, tenantId: site.tenantId } }),
  ]);

  const publicUrl = `/p/${site.slug}`;

  return (
    <AdminPageShell
      badge="Site Workspace"
      title={site.title}
      description={`${site.tenant.displayName} · /p/${site.slug}`}
      backHref="/admin/sites"
      backLabel="المواقع"
      breadcrumbs={[{ label: "الإدارة", href: "/admin/sites" }, { label: site.title }]}
      actions={[
        { label: "العميل", href: `/admin/customers/${site.tenant.id}`, icon: BadgeCheck },
        { label: "بحث الموقع", href: `/admin/search?q=${encodeURIComponent(site.slug)}`, icon: Search },
        { label: "Audit", href: `/admin/audit?q=${encodeURIComponent(site.id)}`, icon: ShieldCheck },
      ]}
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="الحالة" value={site.status} />
        <Metric label="النشر" value={site.isPublished ? "منشور" : "غير منشور"} accent={site.isPublished} />
        <Metric label="الإصدار" value={`v${site.publishedVersion}`} />
        <Metric label="الدومينات" value={site.domains.length.toLocaleString("ar-EG")} />
        <Metric label="الوسائط" value={mediaCount.toLocaleString("ar-EG")} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="ملخص الموقع" icon={Globe}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Slug" value={`/p/${site.slug}`} dir="ltr" />
            <Info label="Public URL" value={publicUrl} dir="ltr" />
            <Info label="Locale" value={site.locale} />
            <Info label="Created" value={dateLabel(site.createdAt)} />
            <Info label="Updated" value={dateLabel(site.updatedAt)} />
            <Info label="Slug change used" value={site.slugChangeUsed ? "نعم" : "لا"} />
          </div>
          {site.description ? <p className="mt-4 rounded-xl border border-white/8 bg-black/18 p-3 text-sm font-bold leading-7 text-white/55">{site.description}</p> : null}
        </Panel>

        <Panel title="العميل والمالك" icon={BadgeCheck}>
          <div className="grid gap-3">
            <Info label="Tenant" value={site.tenant.displayName} />
            <Info label="Tenant status" value={site.tenant.status} />
            <Info label="Owner" value={site.tenant.owner.name} />
            <Info label="Email" value={site.tenant.owner.email} dir="ltr" />
            <Link href={`/admin/customers/${site.tenant.id}`} className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 text-sm font-black text-amber-200 no-underline transition hover:bg-amber-500/20">
              فتح Customer 360
              <ExternalLink className="size-4" />
            </Link>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="الدومينات" icon={Globe}>
          {site.domains.length === 0 ? <Empty text="لا توجد دومينات مخصصة." /> : (
            <div className="grid gap-2">
              {site.domains.map((domain) => (
                <div key={domain.id} className="rounded-xl border border-white/8 bg-black/16 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="font-mono text-sm text-white/80">{domain.domain}</strong>
                    <span className={`rounded-full border px-2 py-0.5 text-[0.68rem] font-black ${domainTone(domain.status)}`}>{domain.status}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-white/35">Token: <span dir="ltr" className="font-mono">{domain.verificationToken}</span></p>
                  <p className="mt-1 text-xs font-bold text-white/35">Verified: {dateLabel(domain.verifiedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="الثيم والتصميم" icon={Brush}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Theme" value={site.theme.name} />
            <Info label="Code" value={site.theme.code} dir="ltr" />
            <Info label="Category" value={site.theme.category} />
            <Info label="Version" value={`v${site.theme.version}`} />
            <Info label="Status" value={site.theme.status} />
            <Info label="Theme config" value={site.themeConfig ? "موجود" : "غير مخصص"} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <CollectionPanel title="Sections" icon={Layers3} count={site.sections.length}>
          {site.sections.map((section) => <CompactItem key={section.id} title={section.type} subtitle={`Order ${section.sortOrder} · ${section.isVisible ? "visible" : "hidden"}`} />)}
        </CollectionPanel>
        <CollectionPanel title="Packages" icon={PackageCheck} count={site.packages.length}>
          {site.packages.map((pkg) => <CompactItem key={pkg.id} title={pkg.name} subtitle={`${pkg.priceAmount.toLocaleString("ar-EG")} ${pkg.currency} · ${pkg.isHighlighted ? "Highlighted" : "Standard"}`} />)}
        </CollectionPanel>
        <CollectionPanel title="Extras" icon={Boxes} count={site.extras.length}>
          {site.extras.map((extra) => <CompactItem key={extra.id} title={extra.name} subtitle={`${extra.priceAmount.toLocaleString("ar-EG")} ${extra.currency} · ${extra.isActive ? "Active" : "Inactive"}`} />)}
        </CollectionPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Panel title="SEO & Contact" icon={Search}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="SEO title" value={site.seoSettings?.title ?? "غير مضبوط"} />
            <Info label="Robots index" value={site.seoSettings?.robotsIndex ? "Index" : "No index"} />
            <Info label="Canonical" value={site.seoSettings?.canonicalUrl ?? "—"} dir="ltr" />
            <Info label="Contact email" value={site.contact?.email ?? "—"} dir="ltr" />
            <Info label="Phone" value={site.contact?.phone ?? "—"} dir="ltr" />
            <Info label="Website" value={site.contact?.website ?? "—"} dir="ltr" />
          </div>
        </Panel>

        <Panel title="Feature Flags & Signals" icon={Flag}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Site flags" value={site.featureFlags.length.toLocaleString("ar-EG")} />
            <Info label="Audit events" value={auditCount.toLocaleString("ar-EG")} />
            <Info label="Notifications" value={notificationCount.toLocaleString("ar-EG")} />
          </div>
          <div className="mt-4 grid gap-2">
            {site.featureFlags.length === 0 ? <Empty text="لا توجد Feature Flags مرتبطة بهذا الموقع." /> : site.featureFlags.map((flag) => <CompactItem key={flag.id} title={flag.key} subtitle={`${flag.scope} · ${flag.enabled ? "enabled" : "disabled"} · ${dateLabel(flag.updatedAt)}`} />)}
          </div>
        </Panel>
      </section>

      <Panel title="Gallery Albums" icon={Image}>
        {site.albums.length === 0 ? <Empty text="لا توجد ألبومات." /> : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {site.albums.map((album) => (
              <div key={album.id} className="rounded-xl border border-white/8 bg-black/16 p-3">
                <strong className="block truncate text-sm font-black text-white/82">{album.title}</strong>
                <p className="mt-1 text-xs font-bold text-white/38">{album.images.length} عينات معروضة · {album.isVisible ? "visible" : "hidden"}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </AdminPageShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className={accent ? "text-xl font-black text-emerald-300" : "text-xl font-black text-[#fff7e8]"}>{value}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Globe; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-[#fff7e8]"><Icon className="size-4 text-amber-300" /> {title}</h2>
      {children}
    </section>
  );
}

function CollectionPanel({ title, icon: Icon, count, children }: { title: string; icon: typeof Layers3; count: number; children: ReactNode }) {
  return (
    <Panel title={`${title} · ${count.toLocaleString("ar-EG")}`} icon={Icon}>
      <div className="grid gap-2">
        {count === 0 ? <Empty text="لا توجد عناصر." /> : children}
      </div>
    </Panel>
  );
}

function Info({ label, value, dir }: { label: string; value: string; dir?: "ltr" | "rtl" }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <p className="text-[0.68rem] font-black text-white/32">{label}</p>
      <p dir={dir} className="mt-1 truncate text-sm font-bold text-white/68">{value}</p>
    </div>
  );
}

function CompactItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <strong className="block truncate text-sm font-black text-white/80">{title}</strong>
      <span className="mt-1 block truncate text-xs font-bold text-white/36">{subtitle}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-white/10 bg-black/12 px-3 py-5 text-center text-sm font-bold text-white/35">{text}</p>;
}
