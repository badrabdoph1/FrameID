"use client"

import { User, Globe, CreditCard, DollarSign, Image, Activity, Smartphone, Bell, Shield, BookOpen, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export type TabId = "overview" | "website" | "subscription" | "payments" | "media" | "activity" | "sessions" | "notifications" | "audit" | "notes"

type Tab = { id: TabId; label: string; icon: LucideIcon }

const tabs: Tab[] = [
  { id: "overview", label: "نظرة عامة", icon: User },
  { id: "website", label: "الموقع", icon: Globe },
  { id: "subscription", label: "الاشتراك", icon: CreditCard },
  { id: "payments", label: "المدفوعات", icon: DollarSign },
  { id: "media", label: "الوسائط", icon: Image },
  { id: "activity", label: "النشاط", icon: Activity },
  { id: "sessions", label: "الجلسات", icon: Smartphone },
  { id: "notifications", label: "الإشعارات", icon: Bell },
  { id: "audit", label: "التدقيق", icon: Shield },
  { id: "notes", label: "ملاحظات", icon: BookOpen },
]

export function CustomerTabBar({ activeTab, onChange }: { activeTab: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/8 bg-white/3 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[0.7rem] font-extrabold transition whitespace-nowrap",
              isActive ? "bg-amber-500/15 text-[#f3cf73]" : "text-white/40 hover:bg-white/5 hover:text-white/60",
            )}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
