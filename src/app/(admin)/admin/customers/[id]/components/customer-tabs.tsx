import Link from "next/link";
import { Bell, CreditCard, Globe, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type CustomerWorkspaceId = "overview" | "site" | "billing" | "support";
export type TabId = CustomerWorkspaceId;

type CustomerWorkspace = {
  id: CustomerWorkspaceId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const customerTabs: readonly CustomerWorkspace[] = [
  { id: "overview", label: "الملخص والإجراءات", description: "البيانات والإجراءات اليومية", icon: User },
  { id: "site", label: "الموقع والملفات", description: "النشر والوسائط", icon: Globe },
  { id: "billing", label: "الاشتراك والمدفوعات", description: "الخطة والسجل المالي", icon: CreditCard },
  { id: "support", label: "الدعم والحماية", description: "الدخول والتواصل", icon: Bell },
];

const workspaceByTab: Record<string, CustomerWorkspaceId> = {
  overview: "overview",
  site: "site",
  website: "site",
  media: "site",
  billing: "billing",
  subscription: "billing",
  payments: "billing",
  support: "support",
  sessions: "support",
  notifications: "support",
  notes: "support",
};

export function normalizeCustomerTab(value: string | null | undefined): CustomerWorkspaceId {
  return value ? workspaceByTab[value] ?? "overview" : "overview";
}

export function CustomerTabBar({
  activeTab,
  basePath,
  onChange,
}: {
  activeTab: CustomerWorkspaceId;
  basePath: string;
  onChange: (tab: CustomerWorkspaceId) => void;
}) {
  return (
    <nav aria-label="أقسام ملف العميل" className="rounded-xl border border-white/8 bg-white/3 p-1">
      <div className="grid grid-cols-2 gap-1 lg:grid-cols-4">
        {customerTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              data-customer-workspace={tab.id}
              href={`${basePath}?tab=${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                "flex min-h-14 items-center gap-2 rounded-lg px-2.5 py-2 text-right no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 sm:px-3",
                active
                  ? "bg-amber-500/15 text-[#f3cf73]"
                  : "text-white/45 hover:bg-white/5 hover:text-white/75",
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-black/10">
                <Icon aria-hidden="true" size={15} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black text-current">{tab.label}</span>
                <span className={cn("mt-0.5 block truncate text-[0.65rem] font-bold", active ? "text-amber-100/55" : "text-white/30")}>
                  {tab.description}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
