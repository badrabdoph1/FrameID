import Link from "next/link";
import { Bell, BookOpen, CreditCard, DollarSign, Globe, Image, Smartphone, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type TabId = "overview" | "website" | "subscription" | "payments" | "media" | "sessions" | "notifications" | "notes";
type Tab = { id: TabId; label: string; icon: LucideIcon };
export const customerTabs: readonly Tab[] = [
  { id: "overview", label: "نظرة عامة", icon: User }, { id: "website", label: "الموقع", icon: Globe },
  { id: "subscription", label: "الاشتراك", icon: CreditCard }, { id: "payments", label: "المدفوعات", icon: DollarSign },
  { id: "media", label: "الوسائط", icon: Image }, { id: "sessions", label: "الجلسات", icon: Smartphone },
  { id: "notifications", label: "الإشعارات", icon: Bell }, { id: "notes", label: "الملاحظات", icon: BookOpen },
];
export function normalizeCustomerTab(value: string | null | undefined): TabId { return customerTabs.some((tab) => tab.id === value) ? value as TabId : "overview"; }
export function CustomerTabBar({ activeTab, basePath, onChange }: { activeTab: TabId; basePath: string; onChange: (tab: TabId) => void }) {
  return <nav aria-label="أقسام ملف العميل" className="overflow-x-auto rounded-xl border border-white/8 bg-white/3 p-1 admin-scrollbar"><div role="tablist" className="flex min-w-max gap-1">{customerTabs.map((tab) => { const Icon = tab.icon; const active = activeTab === tab.id; return <Link key={tab.id} role="tab" aria-selected={active} href={`${basePath}?tab=${tab.id}`} onClick={() => onChange(tab.id)} className={cn("flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-extrabold no-underline transition", active ? "bg-amber-500/15 text-[#f3cf73]" : "text-white/45 hover:bg-white/5 hover:text-white/70")}><Icon aria-hidden="true" size={15} />{tab.label}</Link>; })}</div></nav>;
}
