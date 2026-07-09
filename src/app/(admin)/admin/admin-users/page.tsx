import { ShieldCheck, UserCog, UsersRound } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { ROLES } from "@/modules/admin/permissions";
import { getPublicAccountIdentifier } from "@/modules/auth/auth-identifier";

export const dynamic = "force-dynamic";

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

export default async function AdminUsersPage() {
  await requireAdminPermission("security", "view");

  const [adminUsers, activeSessions] = await Promise.all([
    prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { sessions: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
    prisma.adminSession.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);

  const roles = Object.values(ROLES).sort((a, b) => b.level - a.level);

  return (
    <AdminPageShell
      badge="Security & Governance"
      title="Admin Users & RBAC Overview"
      description="نظرة تشغيلية على AdminUser sessions والأدوار والصلاحيات الحالية قبل الانتقال إلى RBAC database-managed."
      breadcrumbs={[{ label: "النظام", href: "/admin" }, { label: "Admin Users" }]}
      actions={[{ label: "Security", href: "/admin/security", icon: ShieldCheck }]}
    >
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Admin Users" value={adminUsers.length} />
        <Metric label="Active Sessions" value={activeSessions} accent />
        <Metric label="Defined Roles" value={roles.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <header className="flex items-center gap-2 border-b border-white/8 bg-black/18 px-4 py-3">
            <UserCog className="size-4 text-amber-300" />
            <h2 className="text-sm font-black text-[#fff7e8]">Admin Users</h2>
          </header>
          <div className="grid divide-y divide-white/6">
            {adminUsers.length === 0 ? <p className="px-4 py-12 text-center text-sm font-bold text-white/35">لا يوجد AdminUser محفوظ في قاعدة البيانات.</p> : adminUsers.map((admin) => (
              <article key={admin.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-white/84">{admin.name}</h3>
                    <p className="mt-1 truncate font-mono text-xs font-bold text-white/38" dir="ltr">
                      {getPublicAccountIdentifier({ email: admin.email, phone: admin.phone })}
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.68rem] font-black text-amber-200">{admin.role}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Info label="Created" value={dateLabel(admin.createdAt)} />
                  <Info label="Updated" value={dateLabel(admin.updatedAt)} />
                  <Info label="Sessions" value={admin.sessions.length.toLocaleString("ar-EG")} />
                </div>
                {admin.sessions.length > 0 ? (
                  <div className="mt-3 grid gap-2">
                    {admin.sessions.map((session) => (
                      <div key={session.id} className="rounded-xl border border-white/8 bg-black/16 p-3">
                        <p className="font-mono text-[0.68rem] font-bold text-white/35">{session.id}</p>
                        <p className="mt-1 text-xs font-bold text-white/45">expires: {dateLabel(session.expiresAt)} · {session.revokedAt ? `revoked: ${dateLabel(session.revokedAt)}` : "active"}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
          <header className="flex items-center gap-2 border-b border-white/8 bg-black/18 px-4 py-3">
            <ShieldCheck className="size-4 text-amber-300" />
            <h2 className="text-sm font-black text-[#fff7e8]">Roles & Permissions</h2>
          </header>
          <div className="grid divide-y divide-white/6">
            {roles.map((role) => (
              <article key={role.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white/84">{role.name}</h3>
                    <p className="mt-1 font-mono text-xs font-bold text-white/35">{role.id}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.68rem] font-black text-white/42">Level {role.level}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {role.permissions.map((permission) => (
                    <span key={permission.center} className="rounded-full border border-white/8 bg-black/18 px-2 py-1 text-[0.68rem] font-bold text-white/42">
                      {permission.center}: {permission.actions.join("/")}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <UsersRound className={accent ? "size-5 text-amber-300" : "size-5 text-white/35"} />
      <p className={accent ? "mt-3 text-2xl font-black text-amber-200" : "mt-3 text-2xl font-black text-[#fff7e8]"}>{value.toLocaleString("ar-EG")}</p>
      <p className="mt-1 text-xs font-black text-white/38">{label}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/16 p-3">
      <p className="text-[0.68rem] font-black text-white/32">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-white/62">{value}</p>
    </div>
  );
}
