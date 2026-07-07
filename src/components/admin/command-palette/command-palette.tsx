"use client";

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAdmin } from "@/components/layout/admin-context";

type SearchResult = {
  id: string;
  label: string;
  description?: string;
  href: string;
  group: string;
};

const adminPages: SearchResult[] = [
  { id: "dashboard", label: "لوحة القيادة", description: "نظرة عامة على المنصة", href: "/admin", group: "الرئيسية" },
  { id: "customers", label: "العملاء", description: "إدارة العملاء", href: "/admin/customers", group: "الإدارة" },
  { id: "sites", label: "المواقع", description: "إدارة المواقع", href: "/admin/sites", group: "الإدارة" },
  { id: "subscriptions", label: "الاشتراكات", description: "إدارة الاشتراكات", href: "/admin/subscriptions", group: "الإدارة" },
  { id: "payments", label: "المدفوعات", description: "مراجعة المدفوعات", href: "/admin/payments", group: "الإدارة" },
  { id: "templates", label: "القوالب", description: "إدارة القوالب", href: "/admin/templates", group: "المحتوى" },
  { id: "content", label: "المحتوى", description: "إدارة محتوى المنصة", href: "/admin/content", group: "المحتوى" },
  { id: "media", label: "الوسائط", description: "مدير الملفات والصور", href: "/admin/media", group: "المحتوى" },
  { id: "themes", label: "السمات", description: "إدارة السمات", href: "/admin/themes", group: "المحتوى" },
  { id: "backups", label: "النسخ الاحتياطي", description: "مركز النسخ الاحتياطي", href: "/admin/backups", group: "التشغيل" },
  { id: "analytics", label: "التحليلات", description: "إحصائيات المنصة", href: "/admin/analytics", group: "التشغيل" },
  { id: "audit", label: "سجل التدقيق", description: "سجل أحداث المنصة", href: "/admin/audit", group: "التشغيل" },
  { id: "notifications", label: "الإشعارات", description: "إدارة الإشعارات", href: "/admin/notifications", group: "النظام" },
  { id: "security", label: "الأمان", description: "إعدادات الأمان", href: "/admin/security", group: "النظام" },
  { id: "support", label: "الدعم", description: "تذاكر الدعم", href: "/admin/support", group: "النظام" },
  { id: "settings", label: "الإعدادات", description: "إعدادات المنصة", href: "/admin/settings", group: "الإعدادات" },
];

export function AdminCommandPalette() {
  const router = useRouter();
  const { searchOpen, setSearchOpen } = useAdmin();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  const results = query.trim()
    ? adminPages.filter(
        (r) =>
          r.label.includes(query) ||
          r.description?.includes(query) ||
          r.group.includes(query),
      )
    : adminPages.slice(0, 8);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.group]) acc[r.group] = [];
    acc[r.group].push(r);
    return acc;
  }, {});

  const flatResults = results;
  const currentIndex = Math.min(selectedIndex, flatResults.length - 1);

  const navigate = useCallback(
    (href: string) => {
      setSearchOpen(false);
      router.push(href);
    },
    [router, setSearchOpen],
  );

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatResults[currentIndex]) {
      navigate(flatResults[currentIndex].href);
    }
  };

  if (!searchOpen) {
    return (
      <button
        onClick={() => setSearchOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 text-sm text-white/30 transition hover:border-white/[0.12] hover:text-white/60 w-56"
      >
        <Search className="size-4" />
        <span>بحث سريع...</span>
        <kbd className="mr-auto flex items-center gap-0.5 rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/20">
          <Command className="size-2.5" />K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSearchOpen(false)}
      />
      <div className="animate-scale-in relative z-10 w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-center border-b border-white/[0.06] px-4">
          <Search className="size-4 text-white/30" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="ابحث عن صفحة، إجراء، أو إعداد..."
            className="h-12 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/25"
          />
          <kbd className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/20">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2 admin-scrollbar">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-white/20">
                {group}
              </p>
              {items.map((item) => {
                const globalIndex = flatResults.indexOf(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right transition",
                      globalIndex === currentIndex
                        ? "bg-champagne/10 text-champagne"
                        : "text-white/60 hover:bg-white/[0.04] hover:text-white/80",
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-white/35">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-white/35">
              لا توجد نتائج لـ &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
