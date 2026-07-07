import { CenterPageShell } from "@/components/admin/shared/center-page-shell";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdminSession } from "@/modules/admin/admin-page-guards";

type AdminModuleItem = {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "luxury";
};

type AdminModulePageProps = {
  badge: string;
  title: string;
  description: string;
  items: AdminModuleItem[];
};

export async function AdminModulePage({
  badge,
  title,
  description,
  items
}: AdminModulePageProps) {
  await requireSuperAdminSession();

  return (
    <CenterPageShell
      badge={badge}
      title={title}
      description={description}
      breadcrumbs={[{ label: "القيادة", href: "/admin" }, { label: title }]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.02] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-white/40">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-white/78">{item.value}</p>
              </div>
              <Badge tone={item.tone ?? "neutral"}>مركز</Badge>
            </div>
          </div>
        ))}
      </div>
    </CenterPageShell>
  );
}
