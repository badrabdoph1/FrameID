"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Eye,
  Filter,
  Image as ImageIcon,
  Search,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import {
  moveExpiredTenantAssetsToTrashAction,
  moveAllExpiredAssetsToTrashAction,
} from "./actions";

type TenantData = {
  id: string;
  displayName: string;
  status: string;
  ownerEmail: string;
  ownerName: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  cancelledAt: string | null;
  trialEndsAt: string | null;
  gracePeriodEndsAt: string | null;
  mediaCount: number;
  totalSizeBytes: number;
  totalSizeLabel: string;
};

type AssetData = {
  id: string;
  storageKey: string;
  fileName: string;
  url: string;
  kind: string;
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  createdAt: string;
  tenantName: string;
  tenantStatus: string;
  hasReferences: boolean;
  referenceCount: number;
};

type SortField = "createdAt" | "sizeBytes" | "tenantName" | "referenceCount";
type SortDir = "asc" | "desc";

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    EXPIRED: "منتهي",
    TRIAL_EXPIRED: "انتهت التجربة",
    SUSPENDED: "معلّق",
    ACTIVE: "نشط",
    TRIAL: "تجريبي",
    CANCELLED: "ملغي",
    PAST_DUE: "متأخر",
  };
  return labels[status] ?? status;
}

function statusColor(status: string) {
  const colors: Record<string, string> = {
    EXPIRED: "border-red-400/20 bg-red-400/10 text-red-300",
    TRIAL_EXPIRED: "border-orange-400/20 bg-orange-400/10 text-orange-300",
    SUSPENDED: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    ACTIVE: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    CANCELLED: "border-white/15 bg-white/5 text-white/50",
  };
  return colors[status] ?? "border-white/15 bg-white/5 text-white/50";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ar-EG")} ك.ب`
    : `${(bytes / 1024 / 1024).toLocaleString("ar-EG", { maximumFractionDigits: 1 })} م.ب`;
}

export function CleanupFiltersClient({
  tenants,
  assets,
}: {
  tenants: TenantData[];
  assets: AssetData[];
}) {
  const [search, setSearch] = useState("");
  const [tenantStatus, setTenantStatus] = useState("all");
  const [subStatus, setSubStatus] = useState("all");
  const [minSize, setMinSize] = useState("");
  const [maxSize, setMaxSize] = useState("");
  const [showUsed, setShowUsed] = useState("unused-only");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredAssets = useMemo(() => {
    let result = assets;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.fileName.toLowerCase().includes(q) ||
          a.tenantName.toLowerCase().includes(q) ||
          a.storageKey.toLowerCase().includes(q),
      );
    }

    if (tenantStatus !== "all") {
      result = result.filter((a) => a.tenantStatus === tenantStatus);
    }

    if (subStatus === "used") {
      result = result.filter((a) => a.hasReferences);
    } else if (subStatus === "unused") {
      result = result.filter((a) => !a.hasReferences);
    }

    if (minSize) {
      const min = parseInt(minSize, 10) * 1024;
      if (!isNaN(min)) result = result.filter((a) => a.sizeBytes >= min);
    }
    if (maxSize) {
      const max = parseInt(maxSize, 10) * 1024;
      if (!isNaN(max)) result = result.filter((a) => a.sizeBytes <= max);
    }

    if (showUsed === "unused-only") {
      result = result.filter((a) => !a.hasReferences);
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortField === "sizeBytes") cmp = a.sizeBytes - b.sizeBytes;
      else if (sortField === "tenantName") cmp = a.tenantName.localeCompare(b.tenantName, "ar");
      else if (sortField === "referenceCount") cmp = a.referenceCount - b.referenceCount;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [assets, search, tenantStatus, subStatus, minSize, maxSize, showUsed, sortField, sortDir]);

  const filteredTotalSize = useMemo(
    () => filteredAssets.reduce((sum, a) => sum + a.sizeBytes, 0),
    [filteredAssets],
  );

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("asc");
      }
    },
    [sortField],
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAssets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAssets.map((a) => a.id)));
    }
  }, [selectedIds.size, filteredAssets]);

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleTrashSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const formData = new FormData();
    const selectedAssets = assets.filter((a) => selectedIds.has(a.id));
    const tenantIdSet = new Set(selectedAssets.map((a) => {
      const t = tenants.find((tn) => tn.displayName === a.tenantName);
      return t?.id;
    }).filter(Boolean));
    formData.set("tenantIds", JSON.stringify([...tenantIdSet]));

    startTransition(async () => {
      const result = await moveExpiredTenantAssetsToTrashAction(formData);
      setActionResult(result.message);
      setSelectedIds(new Set());
    });
  }, [selectedIds, assets, tenants]);

  const handleTrashAll = useCallback(() => {
    startTransition(async () => {
      const result = await moveAllExpiredAssetsToTrashAction();
      setActionResult(result.message);
      setSelectedIds(new Set());
    });
  }, []);

  const tenantStatusOptions = [
    { value: "all", label: "جميع الحالات" },
    { value: "EXPIRED", label: "منتهي" },
    { value: "TRIAL_EXPIRED", label: "انتهت التجربة" },
    { value: "SUSPENDED", label: "معلّق" },
  ];

  const subStatusOptions = [
    { value: "all", label: "جميع الاستخدامات" },
    { value: "unused", label: "غير مستخدم فقط" },
    { value: "used", label: "مستخدم حاليًا" },
  ];

  const usageFilterOptions = [
    { value: "unused-only", label: "إخفاء المستخدم (الافتراضي)" },
    { value: "all", label: "عرض الكل" },
  ];

  return (
    <div className="grid gap-4">
      {actionResult && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-500/18 bg-emerald-500/6 p-4">
          <p className="flex-1 text-sm font-extrabold text-emerald-200/90">{actionResult}</p>
          <button
            type="button"
            onClick={() => setActionResult(null)}
            className="shrink-0 text-emerald-300/60 hover:text-emerald-200"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-white/8 bg-black/14 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-[0.68rem] font-black text-white/40">بحث</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم الملف، العميل، المسار..."
              className="min-h-10 w-full rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-9 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-300/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[0.68rem] font-black text-white/40">حالة الحساب</label>
          <Select
            options={tenantStatusOptions}
            value={tenantStatus}
            onValueChange={setTenantStatus}
            className="min-h-10 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.68rem] font-black text-white/40">حالة الاستخدام</label>
          <Select
            options={subStatusOptions}
            value={subStatus}
            onValueChange={setSubStatus}
            className="min-h-10 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.68rem] font-black text-white/40">الحد الأدنى للحجم (ك.ب)</label>
          <input
            type="number"
            value={minSize}
            onChange={(e) => setMinSize(e.target.value)}
            placeholder="0"
            className="min-h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-300/40"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[0.68rem] font-black text-white/40">الحد الأقصى للحجم (ك.ب)</label>
          <input
            type="number"
            value={maxSize}
            onChange={(e) => setMaxSize(e.target.value)}
            placeholder="بلا حد"
            className="min-h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-amber-300/40"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          options={usageFilterOptions}
          value={showUsed}
          onValueChange={setShowUsed}
          className="min-h-10 w-auto text-sm"
        />

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-xs font-black text-white/40">
          <Filter className="size-3.5" />
          <span>{filteredAssets.length.toLocaleString("ar-EG")} نتيجة</span>
          <span>·</span>
          <span>{formatSize(filteredTotalSize)}</span>
        </div>

        <button
          type="button"
          onClick={handleTrashAll}
          disabled={isPending || filteredAssets.filter((a) => !a.hasReferences).length === 0}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-4 text-xs font-black text-red-100/80 transition hover:border-red-300/40 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="size-4" />
          نقل الكل للسلة
        </button>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={handleTrashSelected}
            disabled={isPending}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/14 px-4 text-xs font-black text-amber-100 transition hover:bg-amber-300/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-4" />
            نقل المحدد ({selectedIds.size.toLocaleString("ar-EG")}) للسلة
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#fff7e8]">الحسابات المنتهية</h3>
            <p className="mt-0.5 text-xs font-bold text-white/35">
              اضغط على حساب لعرض وسائطه بالتفصيل
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[0.68rem] font-black text-white/50 transition hover:border-white/20 hover:text-white/70"
            >
              {selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? (
                <CheckSquare className="size-3.5" />
              ) : (
                <Square className="size-3.5" />
              )}
              تحديد الكل
            </button>
          </div>
        </div>

        {tenants.length === 0 ? (
          <div className="rounded-xl border border-white/8 bg-black/14 p-8 text-center">
            <AlertTriangle className="mx-auto size-8 text-white/20" />
            <p className="mt-3 text-sm font-black text-white/45">لا توجد بيانات</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {tenants.map((tenant) => {
              const isExpanded = expandedTenant === tenant.id;
              const tenantAssets = filteredAssets.filter((a) => a.tenantName === tenant.displayName);
              const unusedCount = tenantAssets.filter((a) => !a.hasReferences).length;

              return (
                <div
                  key={tenant.id}
                  className="rounded-xl border border-white/8 bg-black/14 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedTenant(isExpanded ? null : tenant.id)}
                    className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[0.02]"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-[#fff7e8]">{tenant.displayName}</span>
                        <span className={cn("rounded-full border px-2 py-0.5 text-[0.62rem] font-black", statusColor(tenant.status))}>
                          {statusLabel(tenant.status)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-[0.62rem] font-black text-white/42">
                          {tenant.subscriptionStatus}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.68rem] font-bold text-white/35">
                        <span>{tenant.ownerEmail}</span>
                        <span>{tenant.mediaCount.toLocaleString("ar-EG")} صورة</span>
                        <span>{tenant.totalSizeLabel}</span>
                        {unusedCount > 0 && (
                          <span className="text-amber-300/70">{unusedCount} غير مستخدم</span>
                        )}
                        {tenant.subscriptionExpiresAt && (
                          <span>انتهاء: {formatDate(tenant.subscriptionExpiresAt)}</span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="size-4 shrink-0 text-white/30" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-white/30" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/6">
                      {tenantAssets.length === 0 ? (
                        <div className="p-4 text-center text-xs font-bold text-white/30">
                          لا توجد وسائط مطابقة للفلاتر الحالية في هذا الحساب.
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/6 text-[0.68rem] font-black text-white/35">
                                <th className="w-10 px-3 py-2">
                                  <span className="sr-only">تحديد</span>
                                </th>
                                <th className="px-3 py-2 text-right">الملف</th>
                                <th className="px-3 py-2 text-right">النوع</th>
                                <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => toggleSort("sizeBytes")}>
                                  <span className="inline-flex items-center gap-1">
                                    الحجم
                                    <ArrowUpDown className="size-3" />
                                  </span>
                                </th>
                                <th className="px-3 py-2 text-right">الاستخدام</th>
                                <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                                  <span className="inline-flex items-center gap-1">
                                    التاريخ
                                    <ArrowUpDown className="size-3" />
                                  </span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {tenantAssets.map((asset) => (
                                <tr
                                  key={asset.id}
                                  className={cn(
                                    "border-b border-white/4 transition hover:bg-white/[0.02]",
                                    selectedIds.has(asset.id) && "bg-amber-300/[0.04]",
                                  )}
                                >
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleSelectOne(asset.id)}
                                      className="text-white/30 hover:text-amber-300"
                                    >
                                      {selectedIds.has(asset.id) ? (
                                        <CheckSquare className="size-4 text-amber-300" />
                                      ) : (
                                        <Square className="size-4" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="max-w-[200px] truncate px-3 py-2 font-bold text-white/60">
                                    {asset.fileName}
                                  </td>
                                  <td className="px-3 py-2 text-white/35">{asset.kind}</td>
                                  <td className="px-3 py-2 text-white/45">{asset.sizeLabel}</td>
                                  <td className="px-3 py-2">
                                    {asset.hasReferences ? (
                                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[0.62rem] font-black text-emerald-300">
                                        مستخدم ({asset.referenceCount})
                                      </span>
                                    ) : (
                                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[0.62rem] font-black text-amber-300">
                                        غير مستخدم
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-white/30">
                                    {formatDate(asset.createdAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filteredAssets.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <h3 className="text-sm font-black text-[#fff7e8]">الوسائط المفلترة</h3>
          <p className="mt-0.5 text-xs font-bold text-white/35">
            جدول مسطح لجميع النتائج المطابقة للفلاتر — يمكن تحديد عناصر محددة للنقل إلى السلة.
          </p>

          <div className="mt-3 max-h-[500px] overflow-y-auto rounded-xl border border-white/8">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10 bg-[#0a0a0a]">
                <tr className="border-b border-white/8 text-[0.68rem] font-black text-white/35">
                  <th className="w-10 px-3 py-2">
                    <button type="button" onClick={toggleSelectAll} className="text-white/30 hover:text-amber-300">
                      {selectedIds.size === filteredAssets.length && filteredAssets.length > 0 ? (
                        <CheckSquare className="size-4 text-amber-300" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-right">الملف</th>
                  <th className="px-3 py-2 text-right">الحساب</th>
                  <th className="px-3 py-2 text-right">الحالة</th>
                  <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => toggleSort("sizeBytes")}>
                    <span className="inline-flex items-center gap-1">
                      الحجم
                      <ArrowUpDown className="size-3" />
                    </span>
                  </th>
                  <th className="px-3 py-2 text-right">الاستخدام</th>
                  <th className="px-3 py-2 text-right cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                    <span className="inline-flex items-center gap-1">
                      التاريخ
                      <ArrowUpDown className="size-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.slice(0, 200).map((asset) => (
                  <tr
                    key={asset.id}
                    className={cn(
                      "border-b border-white/4 transition hover:bg-white/[0.02]",
                      selectedIds.has(asset.id) && "bg-amber-300/[0.04]",
                    )}
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectOne(asset.id)}
                        className="text-white/30 hover:text-amber-300"
                      >
                        {selectedIds.has(asset.id) ? (
                          <CheckSquare className="size-4 text-amber-300" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2 font-bold text-white/60">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="size-3.5 shrink-0 text-white/20" />
                        {asset.fileName}
                      </div>
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-2 text-white/45">
                      {asset.tenantName}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[0.62rem] font-black", statusColor(asset.tenantStatus))}>
                        {statusLabel(asset.tenantStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-white/45">{asset.sizeLabel}</td>
                    <td className="px-3 py-2">
                      {asset.hasReferences ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[0.62rem] font-black text-emerald-300">
                          مستخدم ({asset.referenceCount})
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[0.62rem] font-black text-amber-300">
                          غير مستخدم
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-white/30">
                      {formatDate(asset.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAssets.length > 200 && (
              <div className="border-t border-white/6 p-3 text-center text-xs font-bold text-white/30">
                يعرض أول 200 نتيجة من أصل {filteredAssets.length.toLocaleString("ar-EG")}. استخدم الفلاتر لتضييق النتائج.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
