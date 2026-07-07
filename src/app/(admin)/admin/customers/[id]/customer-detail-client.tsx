"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Globe,
  CreditCard,
  Activity,
  Shield,
  Archive,
  Trash2,
  Copy,
  KeyRound,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  Image,
  MessageSquare,
  Bell,
  Monitor,
  Smartphone,
  Laptop,
} from "lucide-react";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { AdminConfirmDialog } from "@/components/layout/admin-confirm-dialog";
import { AdminActivityTimeline } from "@/components/layout/admin-activity-timeline";
import {
  suspendCustomerAction,
  activateCustomerAction,
  archiveCustomerAction,
  deleteCustomerAction,
  resetCustomerPasswordAction,
} from "@/app/(admin)/admin/customers/actions";

type CustomerData = {
  id: string;
  displayName: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    createdAt: string;
    emailVerifiedAt: string | null;
  };
  status: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sites: SiteData[];
  subscription: SubscriptionData | null;
  stats: {
    sitesCount: number;
    paymentsCount: number;
    mediaCount: number;
    supportCasesCount: number;
    auditLogsCount: number;
    notificationsCount: number;
    totalRevenue: number;
  };
  recentPayments: PaymentData[];
  recentActivity: ActivityData[];
  sessions: SessionData[];
  supportCases: SupportCaseData[];
};

type SiteData = {
  id: string;
  slug: string;
  title: string;
  status: string;
  themeName: string | null;
  domain: string | null;
  isPublished: boolean;
  publishedVersion: number;
  createdAt: string;
  packagesCount: number;
  albumsCount: number;
  seo: { title: string; description: string } | null;
};

type SubscriptionData = {
  id: string;
  status: string;
  planName: string | null;
  planPrice: number | null;
  planCode: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type PaymentData = {
  id: string;
  method: string;
  amount: number;
  currency: string;
  status: string;
  reference: string | null;
  createdAt: string;
  reviewedAt: string | null;
  adminNote: string | null;
  proofUrl: string | null;
  reviewedByName: string | null;
};

type ActivityData = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
};

type SessionData = {
  id: string;
  lastSeenAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  isRevoked: boolean;
};

type SupportCaseData = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
};

type Props = {
  customer: CustomerData;
  adminId: string;
  adminName: string;
};

type Tab = "overview" | "account" | "sites" | "subscription" | "payments" | "activity" | "security" | "danger";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "overview", label: "نظرة عامة", icon: User },
  { id: "account", label: "الحساب", icon: Shield },
  { id: "sites", label: "المواقع", icon: Globe },
  { id: "subscription", label: "الاشتراك", icon: CreditCard },
  { id: "payments", label: "المدفوعات", icon: DollarSign },
  { id: "activity", label: "النشاط", icon: Activity },
  { id: "security", label: "الأمان", icon: KeyRound },
  { id: "danger", label: "خطورة", icon: AlertTriangle },
];

function StatusSection({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "danger" | "default" }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <span className="text-sm text-white/60">{label}</span>
      <AdminStatusBadge tone={tone}>{value}</AdminStatusBadge>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof User }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      {Icon && <Icon className="size-4 text-white/30 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-white/40">{label}</p>
        <p className="text-sm text-white/80 truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string | number; icon: typeof User; trend?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 text-white/30" />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {trend && <p className="text-xs text-white/35 mt-1">{trend}</p>}
    </div>
  );
}

export function CustomerDetailClient({ customer, adminId, adminName }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    title: string;
    description: string;
    danger?: boolean;
    formData?: FormData;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");

  const generatePassword = useCallback(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let result = "";
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(result);
    setNewPassword(result);
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleAction = async (actionType: string, formData: FormData) => {
    try {
      switch (actionType) {
        case "suspend":
          await suspendCustomerAction(formData);
          break;
        case "activate":
          await activateCustomerAction(formData);
          break;
        case "archive":
          await archiveCustomerAction(formData);
          break;
        case "delete":
          await deleteCustomerAction(formData);
          break;
        case "reset-password":
          await resetCustomerPasswordAction(formData);
          break;
      }
      showMessage("success", "تمت العملية بنجاح");
      router.refresh();
    } catch {
      showMessage("error", "فشلت العملية");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    ACTIVE: "success",
    TRIAL: "warning",
    EXPIRED: "danger",
    SUSPENDED: "danger",
  };

  const subStatusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    ACTIVE: "success",
    TRIAL: "warning",
    EXPIRED: "danger",
    PAST_DUE: "danger",
    CANCELLED: "default",
    SUSPENDED: "danger",
  };

  const TabIcon = tabs.find((t) => t.id === activeTab)?.icon ?? User;

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionMessage.type === "success"
              ? "border-success/20 bg-success/10 text-success"
              : "border-danger/20 bg-danger/10 text-danger"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="flex overflow-x-auto gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? "bg-champagne/15 text-champagne"
                  : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {activeTab === "overview" && (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-4">ملف العميل</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoRow label="الاسم" value={customer.owner.name} icon={User} />
                    <InfoRow label="البريد الإلكتروني" value={customer.owner.email} icon={Mail} />
                    <InfoRow label="الهاتف" value={customer.owner.phone ?? "—"} icon={Phone} />
                    <InfoRow label="تاريخ التسجيل" value={formatDate(customer.createdAt)} icon={Calendar} />
                    <InfoRow label="الدور" value={customer.owner.role} icon={Shield} />
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <CheckCircle2 className="size-4 text-white/30 shrink-0" />
                      <div>
                        <p className="text-xs text-white/40">البريد الموثق</p>
                        <p className="text-sm text-white/80">
                          {customer.owner.emailVerifiedAt ? "موثق" : "غير موثق"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/60">المواقع</h3>
                    <span className="text-xs text-white/40">{customer.sites.length} مواقع</span>
                  </div>
                  {customer.sites.length > 0 ? (
                    <div className="space-y-2">
                      {customer.sites.slice(0, 3).map((site) => (
                        <div
                          key={site.id}
                          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white/80 truncate">{site.title}</p>
                            <p className="text-xs text-white/40" dir="ltr">
                              {site.slug}.frameid.app
                              {site.themeName && ` · ${site.themeName}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <AdminStatusBadge
                              tone={site.status === "PUBLISHED" ? "success" : "default"}
                            >
                              {site.status === "PUBLISHED" ? "منشور" : site.status}
                            </AdminStatusBadge>
                            <a
                              href={`https://${site.slug}.frameid.app`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white/30 hover:text-champagne transition"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/35">لا توجد مواقع بعد</p>
                  )}
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/60">النشاط الأخير</h3>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className="text-xs text-champagne/70 hover:text-champagne transition"
                    >
                      عرض الكل
                    </button>
                  </div>
                  {customer.recentActivity.length > 0 ? (
                    <AdminActivityTimeline
                      events={customer.recentActivity.slice(0, 5).map((a) => ({
                        id: a.id,
                        action: a.action,
                        description: `${a.entityType} · ${a.actorName ?? "النظام"}`,
                        timestamp: a.createdAt,
                      }))}
                    />
                  ) : (
                    <p className="text-sm text-white/35">لا يوجد نشاط</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-4">الحالة</h3>
                  <div className="space-y-2">
                    <StatusSection label="حالة الحساب" value={customer.status} tone={statusTone[customer.status] || "default"} />
                    {customer.subscription && (
                      <>
                        <StatusSection
                          label="الاشتراك"
                          value={customer.subscription.status}
                          tone={subStatusTone[customer.subscription.status] || "neutral"}
                        />
                        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                          <span className="text-sm text-white/60">الخطة</span>
                          <span className="text-sm text-white/80">{customer.subscription.planName ?? "بدون"}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                      <span className="text-sm text-white/60">التجربة</span>
                      <span className="text-sm text-white/80">
                        {customer.trialEndsAt ? formatDate(customer.trialEndsAt) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-4">الإحصائيات</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="المواقع" value={customer.stats.sitesCount} icon={Globe} />
                    <StatCard label="المدفوعات" value={customer.stats.paymentsCount} icon={DollarSign} />
                    <StatCard label="الوسائط" value={customer.stats.mediaCount} icon={Image} />
                    <StatCard label="تذاكر الدعم" value={customer.stats.supportCasesCount} icon={MessageSquare} />
                    <StatCard label="سجل النشاط" value={customer.stats.auditLogsCount} icon={Activity} />
                    <StatCard label="الإشعارات" value={customer.stats.notificationsCount} icon={Bell} />
                  </div>
                  <div className="mt-4 rounded-xl bg-champagne/5 border border-champagne/10 px-4 py-3">
                    <p className="text-xs text-champagne/60">إجمالي الإيرادات</p>
                    <p className="text-lg font-semibold text-champagne">
                      {customer.stats.totalRevenue.toLocaleString("ar-EG")} ج.م
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "account" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4">إدارة الحالة</h3>
              <p className="text-xs text-white/40 mb-4">
                الحالة الحالية: <span className="text-white/80">{customer.status}</span>
              </p>
              <div className="space-y-3">
                {customer.status !== "ACTIVE" && (
                  <form
                    action={async (formData) => {
                      formData.set("customerId", customer.id);
                      handleAction("activate", formData);
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success hover:bg-success/10 transition"
                    >
                      <CheckCircle2 className="size-4" />
                      تفعيل الحساب
                    </button>
                  </form>
                )}
                {customer.status !== "SUSPENDED" && (
                  <form
                    action={async (formData) => {
                      formData.set("customerId", customer.id);
                      const reason = prompt("سبب الإيقاف:");
                      if (!reason) return;
                      formData.set("reason", reason);
                      handleAction("suspend", formData);
                    }}
                  >
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm font-medium text-warning hover:bg-warning/10 transition"
                    >
                      <XCircle className="size-4" />
                      إيقاف الحساب
                    </button>
                  </form>
                )}
                <form
                  action={async (formData) => {
                    formData.set("customerId", customer.id);
                    setConfirmAction({
                      type: "archive",
                      title: "أرشفة العميل",
                      description: "سيتم إخفاء العميل ومواقعه عن لوحة التحكم. يمكنك استعادتها لاحقاً.",
                      formData,
                    });
                  }}
                >
                  <input type="hidden" name="customerId" value={customer.id} />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/[0.04] transition"
                  >
                    <Archive className="size-4" />
                    أرشفة الحساب
                  </button>
                </form>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4">معلومات الحساب</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 mb-1">اسم العميل</p>
                  <p className="text-sm text-white/80">{customer.displayName}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">المالك</p>
                  <p className="text-sm text-white/80">{customer.owner.name}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">البريد الإلكتروني</p>
                  <a
                    href={`mailto:${customer.owner.email}`}
                    className="text-sm text-champagne/70 hover:text-champagne transition"
                  >
                    {customer.owner.email}
                  </a>
                </div>
                {customer.owner.phone && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">الهاتف</p>
                    <a
                      href={`tel:${customer.owner.phone}`}
                      className="text-sm text-champagne/70 hover:text-champagne transition"
                    >
                      {customer.owner.phone}
                    </a>
                  </div>
                )}
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs text-white/40 mb-2">التجربة المجانية</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">البداية</span>
                      <span className="text-white/80">{formatDate(customer.trialStartedAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">النهاية</span>
                      <span className="text-white/80">{formatDate(customer.trialEndsAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/[0.06]">
                  <p className="text-xs text-white/40 mb-2">التواريخ</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">تاريخ الإنشاء</span>
                      <span className="text-white/80">{formatDateTime(customer.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">آخر تحديث</span>
                      <span className="text-white/80">{formatDateTime(customer.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sites" && (
          <div className="space-y-4">
            {customer.sites.length > 0 ? (
              customer.sites.map((site) => (
                <div
                  key={site.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-medium text-white">{site.title}</h4>
                        <AdminStatusBadge
                          tone={site.status === "PUBLISHED" ? "success" : "default"}
                        >
                          {site.status === "PUBLISHED" ? "منشور" : site.status}
                        </AdminStatusBadge>
                      </div>
                      <p className="text-sm text-white/40 mt-1" dir="ltr">
                        {site.slug}.frameid.app
                      </p>
                    </div>
                    <a
                      href={`https://${site.slug}.frameid.app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition"
                    >
                      فتح الموقع
                      <ExternalLink className="size-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-white/40">القالب</p>
                      <p className="text-sm text-white/80">{site.themeName ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">الدومين</p>
                      <p className="text-sm text-white/80" dir="ltr">{site.domain ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">الباقات</p>
                      <p className="text-sm text-white/80">{site.packagesCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">الألبومات</p>
                      <p className="text-sm text-white/80">{site.albumsCount}</p>
                    </div>
                  </div>

                  {site.seo && (
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3">
                      <p className="text-xs text-white/40 mb-1">SEO</p>
                      <p className="text-sm text-white/80">{site.seo.title}</p>
                      {site.seo.description && (
                        <p className="text-xs text-white/50 mt-0.5">{site.seo.description}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <Globe className="size-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">لا توجد مواقع لهذا العميل</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscription" && (
          <div className="grid gap-6 lg:grid-cols-2">
            {customer.subscription ? (
              <>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-4">الاشتراك الحالي</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">الخطة</span>
                      <span className="text-sm font-medium text-white">
                        {customer.subscription.planName ?? "بدون خطة"}
                      </span>
                    </div>
                    {customer.subscription.planPrice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">السعر</span>
                        <span className="text-sm text-white/80">
                          {customer.subscription.planPrice.toLocaleString("ar-EG")} ج.م
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">الحالة</span>
                      <AdminStatusBadge
                        tone={subStatusTone[customer.subscription.status] || "neutral"}
                      >
                        {customer.subscription.status}
                      </AdminStatusBadge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">بداية الفترة</span>
                      <span className="text-sm text-white/80">
                        {formatDate(customer.subscription.currentPeriodStart)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">نهاية الفترة</span>
                      <span className="text-sm text-white/80">
                        {formatDate(customer.subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    {customer.subscription.expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">تاريخ الانتهاء</span>
                        <span className="text-sm text-white/80">
                          {formatDate(customer.subscription.expiresAt)}
                        </span>
                      </div>
                    )}
                    {customer.subscription.activatedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-white/60">تاريخ التفعيل</span>
                        <span className="text-sm text-white/80">
                          {formatDate(customer.subscription.activatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-4">التجربة المجانية</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">تاريخ البداية</span>
                      <span className="text-sm text-white/80">{formatDate(customer.trialStartedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/60">تاريخ النهاية</span>
                      <span className="text-sm text-white/80">{formatDate(customer.trialEndsAt)}</span>
                    </div>
                    {customer.trialEndsAt && (
                      <div className="mt-4 rounded-xl bg-warning/5 border border-warning/20 px-4 py-3">
                        <p className="text-xs text-warning/80">
                          {new Date(customer.trialEndsAt) > new Date()
                            ? `باقي ${Math.ceil((new Date(customer.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} يوماً`
                            : "انتهت التجربة"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <CreditCard className="size-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">لا يوجد اشتراك لهذا العميل</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            {customer.recentPayments.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/40">التاريخ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/40">المبلغ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/40">الطريقة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/40">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/40">المرجع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-white/40">ملاحظة المشرف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.recentPayments.map((p) => (
                      <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white/60">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-white/80">
                            {p.amount.toLocaleString("ar-EG")} {p.currency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/60">{p.method}</td>
                        <td className="px-4 py-3">
                          <AdminStatusBadge
                            tone={
                              p.status === "APPROVED" ? "success"
                                : p.status === "REJECTED" ? "danger"
                                  : "warning"
                            }
                          >
                            {p.status === "APPROVED" ? "مقبول"
                              : p.status === "REJECTED" ? "مرفوض"
                                : p.status === "PENDING" ? "معلق"
                                  : p.status}
                          </AdminStatusBadge>
                        </td>
                        <td className="px-4 py-3 text-white/60" dir="ltr">{p.reference ?? "—"}</td>
                        <td className="px-4 py-3 text-white/60">{p.adminNote ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <DollarSign className="size-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">لا توجد مدفوعات لهذا العميل</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-4">
            {customer.recentActivity.length > 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <AdminActivityTimeline
                  events={customer.recentActivity.map((a) => ({
                    id: a.id,
                    action: a.action,
                    description: `${a.entityType}${a.entityId ? ` #${a.entityId.slice(0, 8)}` : ""} · ${a.actorName ?? "النظام"}`,
                    timestamp: a.createdAt,
                  }))}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                <Activity className="size-8 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/40">لا يوجد نشاط مسجل</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4">إعادة تعيين كلمة المرور</h3>
              <p className="text-xs text-white/40 mb-4">
                سيتم تعيين كلمة مرور جديدة لحساب {customer.owner.email}
              </p>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة"
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 dir=ltr text-left"
                    dir="ltr"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-white/30 hover:text-white/50 transition"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-white/30 hover:text-white/50 transition"
                      title="توليد كلمة مرور"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>

                <form
                  action={async (formData) => {
                    if (!newPassword || newPassword.length < 8) {
                      showMessage("error", "كلمة المرور يجب أن تكون 8 أحرف على الأقل");
                      return;
                    }
                    formData.set("userId", customer.owner.id);
                    formData.set("newPassword", newPassword);
                    handleAction("reset-password", formData);
                    setNewPassword("");
                    setGeneratedPassword("");
                  }}
                >
                  <input type="hidden" name="userId" value={customer.owner.id} />
                  <input type="hidden" name="newPassword" value={newPassword} />
                  <button
                    type="submit"
                    disabled={!newPassword}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-champagne px-4 py-3 text-sm font-semibold text-ink hover:bg-champagne/90 transition disabled:opacity-50"
                  >
                    <KeyRound className="size-4" />
                    إعادة تعيين كلمة المرور
                  </button>
                </form>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4">الجلسات النشطة</h3>
              {customer.sessions.length > 0 ? (
                <div className="space-y-2">
                  {customer.sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <div className="shrink-0">
                        {s.userAgent?.includes("Mobile") ? (
                          <Smartphone className="size-4 text-white/30" />
                        ) : s.userAgent?.includes("Tablet") ? (
                          <Monitor className="size-4 text-white/30" />
                        ) : (
                          <Laptop className="size-4 text-white/30" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white/80 truncate">
                          {s.ipAddress ?? "—"} · {s.userAgent?.slice(0, 40) ?? "—"}
                        </p>
                        <p className="text-xs text-white/40">
                          {formatDateTime(s.lastSeenAt || s.createdAt)}
                          {s.isRevoked && " · ملغية"}
                          {!s.isRevoked && new Date(s.expiresAt) < new Date() && " · منتهية"}
                        </p>
                      </div>
                      {s.isRevoked ? (
                        <XCircle className="size-4 text-danger/60 shrink-0" />
                      ) : (
                        <CheckCircle2 className="size-4 text-success/60 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/35">لا توجد جلسات</p>
              )}
            </div>

            <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-sm font-medium text-white/60 mb-4">تذاكر الدعم</h3>
              {customer.supportCases.length > 0 ? (
                <div className="space-y-2">
                  {customer.supportCases.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-white/80">{c.subject}</p>
                        <p className="text-xs text-white/40">{formatDateTime(c.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <AdminStatusBadge
                          tone={
                            c.status === "OPEN" ? "warning"
                              : c.status === "RESOLVED" ? "success"
                                : "neutral"
                          }
                        >
                          {c.status}
                        </AdminStatusBadge>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            c.priority === "high"
                              ? "bg-danger/10 text-danger"
                              : c.priority === "normal"
                                ? "bg-warning/10 text-warning"
                                : "bg-white/[0.04] text-white/40"
                          }`}
                        >
                          {c.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/35">لا توجد تذاكر دعم</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "danger" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-danger/20 bg-danger/[0.03] p-5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="size-6 text-danger/60 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-danger mb-2">منطقة خطورة</h3>
                  <p className="text-sm text-danger/70">
                    هذه الإجراءات لا يمكن التراجع عنها بسهولة. يرجى التأكد قبل تنفيذ أي منها.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Archive className="size-5 text-white/40" />
                  <div>
                    <h4 className="text-sm font-medium text-white">أرشفة العميل</h4>
                    <p className="text-xs text-white/40">
                      إخفاء العميل ومواقعه عن لوحة التحكم دون حذف البيانات
                    </p>
                  </div>
                </div>
                <form
                  action={async (formData) => {
                    formData.set("customerId", customer.id);
                    handleAction("archive", formData);
                  }}
                >
                  <input type="hidden" name="customerId" value={customer.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] transition"
                  >
                    أرشفة
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Download className="size-5 text-white/40" />
                  <div>
                    <h4 className="text-sm font-medium text-white">تصدير البيانات</h4>
                    <p className="text-xs text-white/40">
                      تصدير جميع بيانات العميل بما في ذلك المدفوعات والنشاط والجلسات
                    </p>
                  </div>
                </div>
                <a
                  href={`/admin/api/customers/${customer.id}/export`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.04] transition"
                >
                  <Download className="size-4" />
                  تصدير
                </a>
              </div>

              <div className="rounded-xl border border-danger/20 bg-danger/[0.03] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Trash2 className="size-5 text-danger/60" />
                  <div>
                    <h4 className="text-sm font-medium text-danger">حذف العميل</h4>
                    <p className="text-xs text-danger/50">
                      حذف نهائي لجميع بيانات العميل بما في ذلك المواقع والمدفوعات والاشتراكات
                    </p>
                  </div>
                </div>
                <form
                  action={async (formData) => {
                    formData.set("customerId", customer.id);
                    setConfirmAction({
                      type: "delete",
                      title: "حذف العميل نهائياً",
                      description: `سيتم حذف ${customer.displayName} و ${customer.sites.length} موقع وجميع البيانات المرتبطة. هذا الإجراء لا يمكن التراجع عنه.`,
                      danger: true,
                      formData,
                    });
                  }}
                >
                  <input type="hidden" name="customerId" value={customer.id} />
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-danger/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-danger transition"
                  >
                    <Trash2 className="size-4" />
                    حذف العميل
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmAction && (
        <form
          action={async () => {
            if (confirmAction.formData) {
              const type = confirmAction.type;
              const fd = confirmAction.formData;
              setConfirmAction(null);
              await handleAction(type, fd);
            }
          }}
        >
          <AdminConfirmDialog
            open
            title={confirmAction.title}
            description={confirmAction.description}
            danger={confirmAction.danger}
            onConfirm={() => {}}
            onCancel={() => setConfirmAction(null)}
          />
        </form>
      )}
    </div>
  );
}
