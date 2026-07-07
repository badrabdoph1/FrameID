"use client";

import React, {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SearchResult = {
  id: string;
  label: string;
  description?: string;
  href: string;
  group: string;
};

const adminPages: SearchResult[] = [
  { id: "dashboard", label: "القيادة", description: "نظرة عامة على المنصة", href: "/admin", group: "الصفحات" },
  { id: "customers", label: "العملاء", description: "إدارة العملاء", href: "/admin/customers", group: "التشغيل" },
  { id: "sites", label: "المواقع", description: "إدارة المواقع", href: "/admin/sites", group: "التشغيل" },
  { id: "payments", label: "المدفوعات", description: "مراجعة المدفوعات", href: "/admin/payments", group: "التشغيل" },
  { id: "backups", label: "النسخ الاحتياطي", href: "/admin/backups", group: "المنصة" },
  { id: "security", label: "الأمان", href: "/admin/security", group: "المنصة" },
  { id: "support", label: "الدعم", href: "/admin/support", group: "المنصة" },
  { id: "settings", label: "الإعدادات", href: "/admin/settings", group: "الإعدادات" },
  { id: "content", label: "المحتوى", description: "إدارة محتوى المنصة", href: "/admin/content", group: "المحتوى" },
  { id: "media", label: "الوسائط", href: "/admin/media", group: "المحتوى" },
  { id: "templates", label: "القوالب", href: "/admin/templates", group: "المحتوى" },
  { id: "themes", label: "السمات", href: "/admin/themes", group: "المحتوى" },
  { id: "analytics", label: "التحليلات", href: "/admin/analytics", group: "المنصة" },
  { id: "notifications", label: "الإشعارات", href: "/admin/notifications", group: "المنصة" },
  { id: "feature-flags", label: "الميزات", href: "/admin/feature-flags", group: "المنصة" },
  { id: "audit", label: "سجل التدقيق", href: "/admin/audit", group: "المنصة" },
  { id: "marketing", label: "التسويق", href: "/admin/marketing", group: "التسويق" },
];

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

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
      setOpen(false);
      router.push(href);
    },
    [router],
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-[var(--radius-control)] border border-white/10 bg-white/[0.03] px-3 text-sm text-white/40 transition hover:border-white/20 hover:text-white/60 w-56"
      >
        <Search className="size-4" />
        <span>بحث سريع...</span>
        <kbd className="mr-auto flex items-center gap-0.5 rounded-[var(--radius-control)] border border-white/10 px-1.5 py-0.5 text-[10px] text-white/30">
          <Command className="size-2.5" />K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />
      <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-panel)] border border-white/10 bg-[#0f0f0f] shadow-2xl animate-fade-in">
        <div className="flex items-center border-b border-white/10 px-4">
          <Search className="size-4 text-white/40" />
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
            className="h-12 w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/30"
          />
          <button
            onClick={() => setOpen(false)}
            className="flex size-6 items-center justify-center rounded-[var(--radius-control)] text-[10px] text-white/30 transition hover:bg-white/10 hover:text-white/60"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-3 py-2 text-xs font-medium text-white/30">
                {group}
              </p>
              {items.map((item, i) => {
                const globalIndex = flatResults.indexOf(item);
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2.5 text-right transition",
                      globalIndex === currentIndex
                        ? "bg-champagne/10 text-champagne"
                        : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-white/40">
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
            <p className="px-3 py-8 text-center text-sm text-white/40">
              لا توجد نتائج لـ &quot;{query}&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
