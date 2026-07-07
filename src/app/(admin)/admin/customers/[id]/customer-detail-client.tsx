"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Globe, CreditCard, DollarSign, Activity, Shield,
  Archive, Trash2, Copy, KeyRound, ExternalLink, Mail, Phone,
  Calendar, CheckCircle2, XCircle, AlertTriangle, Clock,
  Download, Eye, EyeOff, ChevronLeft, ChevronRight,
  Image, MessageSquare, Bell, Monitor, Smartphone, Laptop,
  FileText, Search, Link2, BarChart3, Zap, PauseCircle,
  PlayCircle, RefreshCw, Send, Ban, Settings, Info,
  ShoppingBag, HardDrive, FolderOpen, BookOpen,
} from "lucide-react";
import { AdminStatusBadge } from "@/components/layout/admin-status-badge";
import { AdminConfirmDialog } from "@/components/layout/admin-confirm-dialog";
import { AdminActivityTimeline } from "@/components/layout/admin-activity-timeline";
import {
  suspendCustomerAction, activateCustomerAction, archiveCustomerAction,
  deleteCustomerAction, resetCustomerPasswordAction,
  extendCustomerTrialAction, activateCustomerSubscriptionAction,
  cancelCustomerSubscriptionAction, publishSiteAction, suspendSiteAction,
  revokeSessionAction, createAdminNoteAction, deleteAdminNoteAction,
  sendNotificationAction, impersonateCustomerAction,
} from "@/app/(admin)/admin/customers/actions";
import type {
  CustomerDetail, CustomerMediaAsset, CustomerNotification,
  CustomerAdminNote, CustomerSubscriptionInfo,
} from "@/modules/admin/customers/customer-types";

// ─── Props ───

type Props = {
  customer: CustomerDetail;
  media: CustomerMediaAsset[];
  notifications: CustomerNotification[];
  adminNotes: CustomerAdminNote[];
  allSubscriptions: CustomerSubscriptionInfo[];
  adminId: string;
  adminName: string;
};

// ─── Tab types ───

type Tab = "overview" | "website" | "subscription" | "payments" | "media" | "activity" | "sessions" | "notifications" | "audit" | "notes";

const tabs: { id: Tab; label: string; icon: typeof User }[] = [
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
];

// ─── Helpers ───

function StatusSection({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "danger" | "default" | "info" | "champagne" }) {
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

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: typeof User; accent?: boolean }) {
  return (
    <div className={`rounded-xl border ${accent ? "border-champagne/20 bg-champagne/[0.03]" : "border-white/[0.06] bg-white/[0.02]"} p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`size-4 ${accent ? "text-champagne" : "text-white/30"}`} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className={`text-2xl font-semibold ${accent ? "text-champagne" : "text-white"}`}>{value}</p>
    </div>
  );
}

// ─── Main Component ───

export function CustomerDetailClient({
  customer, media, notifications, adminNotes, allSubscriptions,
  adminId, adminName,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    title: string;
    description: string;
    danger?: boolean;
    formData?: FormData;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [notificationForm, setNotificationForm] = useState({ type: "info", title: "", body: "" });

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  }, []);

  const handleAction = useCallback(async (actionType: string, formData: FormData) => {
    try {
      switch (actionType) {
        case "suspend": await suspendCustomerAction(formData); break;
        case "activate": await activateCustomerAction(formData); break;
        case "archive": await archiveCustomerAction(formData); break;
        case "delete": await deleteCustomerAction(formData); break;
        case "reset-password": await resetCustomerPasswordAction(formData); break;
        case "extend-trial": await extendCustomerTrialAction(formData); break;
        case "activate-subscription": await activateCustomerSubscriptionAction(formData); break;
        case "cancel-subscription": await cancelCustomerSubscriptionAction(formData); break;
        case "publish-site": await publishSiteAction(formData); break;
        case "suspend-site": await suspendSiteAction(formData); break;
        case "revoke-session": await revokeSessionAction(formData); break;
        case "create-note": await createAdminNoteAction(formData); break;
        case "delete-note": await deleteAdminNoteAction(formData); break;
        case "send-notification": await sendNotificationAction(formData); break;
        case "impersonate": await impersonateCustomerAction(formData); break;
      }
      showMessage("success", "تمت العملية بنجاح");
      router.refresh();
    } catch {
      showMessage("error", "فشلت العملية");
    }
  }, [router, showMessage]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const statusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    TRIAL: "warning", ACTIVE: "success", EXPIRED: "danger", SUSPENDED: "danger",
  };

  const subStatusTone: Record<string, "success" | "warning" | "danger" | "default"> = {
    ACTIVE: "success", TRIAL: "warning", EXPIRED: "danger", PAST_DUE: "danger",
    CANCELLED: "default", SUSPENDED: "danger",
  };

  const bytesToMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);
  const daysRemaining = customer.subscription?.currentPeriodEnd
    ? Math.ceil((new Date(customer.subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const showConfirm = (type: string, title: string, description: string, formData: FormData, danger?: boolean) => {
    setConfirmAction({ type, title, description, danger, formData });
  };

  const confirmAndExecute = async () => {
    if (!confirmAction?.formData) return;
    const { type, formData } = confirmAction;
    setConfirmAction(null);
    await handleAction(type, formData);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showMessage("success", "تم النسخ");
    });
  };

  const siteSlug = customer.sites[0]?.slug ?? "";
  const siteUrl = siteSlug ? `https://${siteSlug}.frameid.app` : null;
  const dashboardUrl = siteUrl ? `${siteUrl}/dashboard` : null;

  return (
    <div className="space-y-6">
      {/* Action message */}
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

      {/* Profile Header */}
      <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-champagne/15 text-2xl font-bold text-champagne">
              {customer.displayName.charAt(0)}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-white">{customer.displayName}</h1>
                <AdminStatusBadge tone={statusTone[customer.status] || "default"}>
                  {customer.status === "ACTIVE" ? "نشط"
                    : customer.status === "TRIAL" ? "تجربة"
                    : customer.status === "SUSPENDED" ? "موقوف"
                    : customer.status === "EXPIRED" ? "منتهي"
                    : customer.status}
                </AdminStatusBadge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/50">
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" /> {customer.owner.email}
                </span>
                {customer.owner.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {customer.owner.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" /> منذ {formatDate(customer.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" /> آخر نشاط: {formatDateTime(customer.updatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-wrap gap-2">
            {siteUrl && (
              <a
                href={siteUrl}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition"
              >
                <ExternalLink className="size-3.5" /> فتح الموقع
              </a>
            )}
            {dashboardUrl && (
              <a
                href={dashboardUrl}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition"
              >
                <Settings className="size-3.5" /> لوحة التحكم
              </a>
            )}
            {siteUrl && (
              <button
                onClick={() => copyToClipboard(siteUrl)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition"
              >
                <Copy className="size-3.5" /> نسخ الرابط
              </button>
            )}
            {dashboardUrl && (
              <button
                onClick={() => copyToClipboard(dashboardUrl)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition"
              >
                <Link2 className="size-3.5" /> نسخ لوحة التحكم
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard label="المواقع" value={customer.stats.sitesCount} icon={Globe} />
        <StatCard label="المدفوعات" value={customer.stats.paymentsCount} icon={DollarSign} />
        <StatCard label="الوسائط" value={customer.stats.mediaCount} icon={Image} />
        <StatCard label="الصور" value={customer.stats.totalImages} icon={FolderOpen} />
        <StatCard label="المساحة" value={`${bytesToMB(customer.stats.totalStorageBytes)} MB`} icon={HardDrive} />
        <StatCard label="الباقات" value={customer.stats.totalPackages} icon={ShoppingBag} />
        <StatCard label="الدعم" value={customer.stats.supportCasesCount} icon={MessageSquare} />
        <StatCard label="الإيرادات" value={`${customer.stats.totalRevenue.toLocaleString("ar-EG")} ج.م`} icon={BarChart3} accent />
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <span className="text-xs text-white/40 flex items-center px-2"><Zap className="size-3 ml-1" />إجراءات سريعة</span>

        <form
          action={async (fd) => {
            fd.set("tenantId", customer.id);
            fd.set("days", "14");
            showConfirm("extend-trial", "تمديد التجربة", `تمديد تجربة ${customer.displayName} لمدة 14 يوماً إضافية؟`, fd);
          }}
        >
          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap">
            <RefreshCw className="size-3" /> تمديد التجربة
          </button>
        </form>

        {customer.status !== "ACTIVE" && (
          <form
            action={async (fd) => {
              fd.set("customerId", customer.id);
              await handleAction("activate", fd);
            }}
          >
            <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-success hover:border-success/30 transition whitespace-nowrap">
              <PlayCircle className="size-3" /> تفعيل
            </button>
          </form>
        )}

        {customer.status !== "SUSPENDED" && (
          <form
            action={async (fd) => {
              fd.set("customerId", customer.id);
              fd.set("reason", "إيقاف بواسطة المشرف");
              showConfirm("suspend", "إيقاف الحساب", `سيتم إيقاف حساب ${customer.displayName}.`, fd, true);
            }}
          >
            <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-warning hover:border-warning/30 transition whitespace-nowrap">
              <PauseCircle className="size-3" /> إيقاف
            </button>
          </form>
        )}

        {customer.status === "SUSPENDED" && (
          <form
            action={async (fd) => {
              fd.set("customerId", customer.id);
              await handleAction("activate", fd);
            }}
          >
            <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-success hover:border-success/30 transition whitespace-nowrap">
              <PlayCircle className="size-3" /> تشغيل
            </button>
          </form>
        )}

        {customer.sites[0] && (
          <>
            <form
              action={async (fd) => {
                fd.set("siteId", customer.sites[0].id);
                fd.set("tenantId", customer.id);
                fd.set("publish", customer.sites[0].isPublished ? "false" : "true");
                showConfirm("publish-site",
                  customer.sites[0].isPublished ? "إيقاف الموقع" : "نشر الموقع",
                  customer.sites[0].isPublished ? "سيتم إيقاف الموقع عن الزوار." : "سيتم نشر الموقع للزوار.",
                  fd, customer.sites[0].isPublished);
              }}
            >
              <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap">
                {customer.sites[0].isPublished ? <XCircle className="size-3" /> : <CheckCircle2 className="size-3" />}
                {customer.sites[0].isPublished ? "إيقاف الموقع" : "تشغيل الموقع"}
              </button>
            </form>
            <form
              action={async (fd) => {
                fd.set("siteId", customer.sites[0].id);
                fd.set("tenantId", customer.id);
                fd.set("suspended", "false");
                showConfirm("suspend-site", "إعادة تشغيل الموقع", "سيتم إعادة تشغيل الموقع للزوار.", fd);
              }}
            >
              <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap">
                <RefreshCw className="size-3" /> إعادة تشغيل
              </button>
            </form>
          </>
        )}

        <form
          action={async (fd) => {
            fd.set("userId", customer.owner.id);
            fd.set("newPassword", Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*".charAt(Math.floor(Math.random() * 70))).join(""));
            showConfirm("reset-password", "إعادة تعيين كلمة المرور", `سيتم إعادة تعيين كلمة مرور حساب ${customer.owner.email}.`, fd, true);
          }}
        >
          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap">
            <KeyRound className="size-3" /> إعادة كلمة المرور
          </button>
        </form>

        <form
          action={async (fd) => {
            fd.set("tenantId", customer.id);
            showConfirm("impersonate", "انتحال صفة العميل", `سيتم تسجيل الدخول باسم ${customer.displayName}.`, fd, true);
          }}
        >
          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-warning hover:border-warning/30 transition whitespace-nowrap">
            <Eye className="size-3" /> impersonation
          </button>
        </form>

        <button
          onClick={() => {
            setNotificationForm({ type: "info", title: "", body: "" });
            setActiveTab("notifications");
          }}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap"
        >
          <Send className="size-3" /> إرسال إشعار
        </button>

        <button
          onClick={() => {
            window.location.href = `mailto:${customer.owner.email}`;
          }}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap"
        >
          <Mail className="size-3" /> إرسال بريد
        </button>

        {customer.owner.phone && (
          <a
            href={`https://wa.me/${customer.owner.phone.replace(/[^0-9]/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition whitespace-nowrap"
          >
            <MessageSquare className="size-3" /> واتساب
          </a>
        )}

        <form
          action={async (fd) => {
            fd.set("customerId", customer.id);
            showConfirm("archive", "أرشفة العميل", "سيتم إخفاء العميل ومواقعه عن لوحة التحكم.", fd);
          }}
        >
          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-xs text-white/50 hover:text-white/70 hover:border-white/20 transition whitespace-nowrap">
            <Archive className="size-3" /> أرشفة
          </button>
        </form>

        <form
          action={async (fd) => {
            fd.set("customerId", customer.id);
            showConfirm("delete", "حذف العميل نهائياً",
              `سيتم حذف ${customer.displayName} و ${customer.stats.sitesCount} موقع وجميع البيانات المرتبطة. هذا الإجراء لا يمكن التراجع عنه.`,
              fd, true);
          }}
        >
          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-danger/20 px-2.5 py-1.5 text-xs text-danger/60 hover:text-danger hover:border-danger/40 transition whitespace-nowrap">
            <Trash2 className="size-3" /> حذف
          </button>
        </form>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في صفحة العميل..."
          className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 pr-10 pl-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50"
        />
      </div>

      {/* Tab bar */}
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

      {/* Main content + Right sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab content */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ───── OVERVIEW ───── */}
          {activeTab === "overview" && (
            <>
              {/* Customer info */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-medium text-white/60 mb-4">ملف العميل</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label="الاسم" value={customer.owner.name} icon={User} />
                  <InfoRow label="البريد الإلكتروني" value={customer.owner.email} icon={Mail} />
                  <InfoRow label="الهاتف" value={customer.owner.phone ?? "—"} icon={Phone} />
                  <InfoRow label="تاريخ التسجيل" value={formatDate(customer.createdAt)} icon={Calendar} />
                  <InfoRow label="آخر تحديث" value={formatDateTime(customer.updatedAt)} icon={Clock} />
                  <InfoRow label="البريد الموثق" value={customer.owner.emailVerifiedAt ? "موثق" : "غير موثق"} icon={CheckCircle2} />
                </div>
              </div>

              {/* Sites preview */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white/60">المواقع</h3>
                  <button onClick={() => setActiveTab("website")} className="text-xs text-champagne/70 hover:text-champagne transition">عرض الكل</button>
                </div>
                {customer.sites.length > 0 ? (
                  <div className="space-y-2">
                    {customer.sites.slice(0, 3).map((site) => (
                      <div key={site.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white/80 truncate">{site.title}</p>
                          <p className="text-xs text-white/40" dir="ltr">{site.slug}.frameid.app {site.themeName && `· ${site.themeName}`}</p>
                        </div>
                        <AdminStatusBadge tone={site.status === "PUBLISHED" ? "success" : "default"}>
                          {site.status === "PUBLISHED" ? "منشور" : site.status}
                        </AdminStatusBadge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/35">لا توجد مواقع</p>
                )}
              </div>

              {/* Activity preview */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white/60">آخر النشاطات</h3>
                  <button onClick={() => setActiveTab("activity")} className="text-xs text-champagne/70 hover:text-champagne transition">عرض الكل</button>
                </div>
                {customer.recentActivity.length > 0 ? (
                  <AdminActivityTimeline events={customer.recentActivity.slice(0, 5).map((a) => ({
                    id: a.id,
                    action: a.action,
                    description: `${a.entityType} · ${a.actorName ?? "النظام"}`,
                    timestamp: a.createdAt,
                  }))} />
                ) : (
                  <p className="text-sm text-white/35">لا يوجد نشاط</p>
                )}
              </div>
            </>
          )}

          {/* ───── WEBSITE ───── */}
          {activeTab === "website" && (
            <div className="space-y-4">
              {customer.sites.length > 0 ? customer.sites.map((site) => (
                <div key={site.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-medium text-white">{site.title}</h4>
                        <AdminStatusBadge tone={site.status === "PUBLISHED" ? "success" : "default"}>
                          {site.status === "PUBLISHED" ? "منشور" : site.status === "DRAFT" ? "مسودة" : site.status}
                        </AdminStatusBadge>
                      </div>
                      <p className="text-sm text-white/40 mt-1" dir="ltr">{site.slug}.frameid.app</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`https://${site.slug}.frameid.app`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition">
                        <ExternalLink className="size-3" /> فتح الموقع
                      </a>
                      <form action={async (fd) => {
                        fd.set("siteId", site.id);
                        fd.set("tenantId", customer.id);
                        fd.set("publish", site.isPublished ? "false" : "true");
                        showConfirm("publish-site",
                          site.isPublished ? "إيقاف الموقع" : "نشر الموقع",
                          site.isPublished ? "سيتم إخفاء الموقع عن الزوار." : "سيتم نشر الموقع للزوار.",
                          fd, site.isPublished);
                      }}>
                        <button type="submit" className="flex items-center gap-1 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition">
                          {site.isPublished ? <XCircle className="size-3" /> : <PlayCircle className="size-3" />}
                          {site.isPublished ? "إيقاف" : "نشر"}
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div><p className="text-xs text-white/40">القالب</p><p className="text-sm text-white/80">{site.themeName ?? "—"}</p></div>
                    <div><p className="text-xs text-white/40">الإصدار</p><p className="text-sm text-white/80">v{site.publishedVersion}</p></div>
                    <div><p className="text-xs text-white/40">الباقات</p><p className="text-sm text-white/80">{site.packagesCount}</p></div>
                    <div><p className="text-xs text-white/40">الألبومات</p><p className="text-sm text-white/80">{site.albumsCount}</p></div>
                    <div><p className="text-xs text-white/40">الخدمات الإضافية</p><p className="text-sm text-white/80">{site.extrasCount}</p></div>
                    <div><p className="text-xs text-white/40">اللغة</p><p className="text-sm text-white/80" dir="ltr">{site.locale}</p></div>
                    <div><p className="text-xs text-white/40">تاريخ الإنشاء</p><p className="text-sm text-white/80">{formatDate(site.createdAt)}</p></div>
                    <div><p className="text-xs text-white/40">آخر تحديث</p><p className="text-sm text-white/80">{formatDate(site.updatedAt)}</p></div>
                  </div>

                  {site.domains.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-white/40 mb-2">النطاقات</p>
                      <div className="space-y-1">
                        {site.domains.map((d) => (
                          <div key={d.domain} className="flex items-center gap-2 text-sm">
                            <span className="text-white/80" dir="ltr">{d.domain}</span>
                            <AdminStatusBadge tone={d.status === "VERIFIED" ? "success" : "warning"}>{d.status}</AdminStatusBadge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {site.seo && (
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] px-4 py-3">
                      <p className="text-xs text-white/40 mb-1">SEO</p>
                      <p className="text-sm text-white/80">{site.seo.title}</p>
                      {site.seo.description && <p className="text-xs text-white/50 mt-0.5">{site.seo.description}</p>}
                    </div>
                  )}
                </div>
              )) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <Globe className="size-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">لا توجد مواقع لهذا العميل</p>
                </div>
              )}
            </div>
          )}

          {/* ───── SUBSCRIPTION ───── */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              {/* Current subscription */}
              <div className="grid gap-6 lg:grid-cols-2">
                {customer.subscription ? (
                  <>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <h3 className="text-sm font-medium text-white/60 mb-4">الاشتراك الحالي</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">الخطة</span>
                          <span className="text-sm font-medium text-white">{customer.subscription.planName ?? "بدون خطة"}</span>
                        </div>
                        {customer.subscription.planPrice && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/60">السعر</span>
                            <span className="text-sm text-white/80">{customer.subscription.planPrice.toLocaleString("ar-EG")} ج.م</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">الحالة</span>
                          <AdminStatusBadge tone={subStatusTone[customer.subscription.status] || "default"}>{customer.subscription.status}</AdminStatusBadge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">بداية الفترة</span>
                          <span className="text-sm text-white/80">{formatDate(customer.subscription.currentPeriodStart)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">نهاية الفترة</span>
                          <span className="text-sm text-white/80">{formatDate(customer.subscription.currentPeriodEnd)}</span>
                        </div>
                        {customer.subscription.expiresAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/60">تاريخ الانتهاء</span>
                            <span className="text-sm text-white/80">{formatDate(customer.subscription.expiresAt)}</span>
                          </div>
                        )}
                        {customer.subscription.activatedAt && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white/60">تاريخ التفعيل</span>
                            <span className="text-sm text-white/80">{formatDate(customer.subscription.activatedAt)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        {customer.subscription.status !== "ACTIVE" && (
                          <form action={async (fd) => {
                            fd.set("subscriptionId", customer.subscription!.id);
                            fd.set("tenantId", customer.id);
                            showConfirm("activate-subscription", "تفعيل الاشتراك", "سيتم تفعيل الاشتراك لهذا العميل.", fd);
                          }}>
                            <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/5 px-3 py-1.5 text-xs text-success hover:bg-success/10 transition">
                              <PlayCircle className="size-3" /> تفعيل الاشتراك
                            </button>
                          </form>
                        )}
                        {customer.subscription.status !== "CANCELLED" && customer.subscription.status !== "EXPIRED" && (
                          <form action={async (fd) => {
                            fd.set("subscriptionId", customer.subscription!.id);
                            fd.set("tenantId", customer.id);
                            showConfirm("cancel-subscription", "إلغاء الاشتراك", "سيتم إلغاء الاشتراك الحالي.", fd, true);
                          }}>
                            <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-danger/20 px-3 py-1.5 text-xs text-danger/60 hover:text-danger hover:border-danger/40 transition">
                              <Ban className="size-3" /> إلغاء الاشتراك
                            </button>
                          </form>
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
                          <div className={`mt-4 rounded-xl px-4 py-3 ${new Date(customer.trialEndsAt) > new Date() ? "bg-warning/5 border border-warning/20" : "bg-danger/5 border border-danger/20"}`}>
                            <p className={`text-xs ${new Date(customer.trialEndsAt) > new Date() ? "text-warning/80" : "text-danger/80"}`}>
                              {new Date(customer.trialEndsAt) > new Date()
                                ? `باقي ${Math.ceil((new Date(customer.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} يوماً`
                                : "انتهت التجربة"}
                            </p>
                          </div>
                        )}
                        <form action={async (fd) => {
                          fd.set("tenantId", customer.id);
                          fd.set("days", "14");
                          showConfirm("extend-trial", "تمديد التجربة", `تمديد تجربة ${customer.displayName} لمدة 14 يوماً إضافية؟`, fd);
                        }}>
                          <button type="submit" className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-1.5 text-xs text-white/50 hover:text-champagne hover:border-champagne/30 transition mt-3">
                            <RefreshCw className="size-3" /> تمديد التجربة 14 يوماً
                          </button>
                        </form>
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

              {/* All subscriptions history */}
              {allSubscriptions.length > 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <h3 className="text-sm font-medium text-white/60 mb-4">سجل الاشتراكات</h3>
                  <div className="space-y-2">
                    {allSubscriptions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <div>
                          <p className="text-sm text-white/80">{sub.planName ?? "بدون خطة"}</p>
                          <p className="text-xs text-white/40">{formatDate(sub.createdAt)} {sub.currentPeriodEnd && `→ ${formatDate(sub.currentPeriodEnd)}`}</p>
                        </div>
                        <AdminStatusBadge tone={subStatusTone[sub.status] || "default"}>{sub.status}</AdminStatusBadge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───── PAYMENTS ───── */}
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/40">إثبات</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/40">المراجع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.recentPayments.map((p) => (
                        <tr key={p.id} className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.02]">
                          <td className="px-4 py-3 text-white/60">{formatDate(p.createdAt)}</td>
                          <td className="px-4 py-3 font-medium text-white/80">
                            {p.amount.toLocaleString("ar-EG")} {p.currency}
                          </td>
                          <td className="px-4 py-3 text-white/60">{p.method}</td>
                          <td className="px-4 py-3">
                            <AdminStatusBadge tone={p.status === "APPROVED" ? "success" : p.status === "REJECTED" ? "danger" : "warning"}>
                              {p.status === "APPROVED" ? "مقبول" : p.status === "REJECTED" ? "مرفوض" : "معلق"}
                            </AdminStatusBadge>
                          </td>
                          <td className="px-4 py-3 text-white/60" dir="ltr">{p.reference ?? "—"}</td>
                          <td className="px-4 py-3">
                            {p.proofUrl ? (
                              <a href={p.proofUrl} target="_blank" rel="noopener noreferrer"
                                className="text-champagne/70 hover:text-champagne transition text-xs">
                                عرض الإثبات
                              </a>
                            ) : <span className="text-white/40">—</span>}
                          </td>
                          <td className="px-4 py-3 text-white/60">{p.reviewedByName ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <DollarSign className="size-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">لا توجد مدفوعات</p>
                </div>
              )}
              <div className="rounded-xl border border-champagne/10 bg-champagne/[0.03] px-4 py-3">
                <p className="text-xs text-champagne/60">إجمالي الإيرادات المعتمدة</p>
                <p className="text-lg font-semibold text-champagne">
                  {customer.stats.totalRevenue.toLocaleString("ar-EG")} ج.م
                </p>
              </div>
            </div>
          )}

          {/* ───── MEDIA ───── */}
          {activeTab === "media" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
                <span className="text-sm text-white/60">المساحة المستخدمة</span>
                <span className="text-sm font-medium text-white">{bytesToMB(customer.stats.totalStorageBytes)} MB من أصل {Math.max(parseInt(bytesToMB(customer.stats.totalStorageBytes)) + 500, 1000)} MB</span>
              </div>
              {media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {media.filter((m) =>
                    !searchQuery || m.alt?.toLowerCase().includes(searchQuery.toLowerCase()) || m.mimeType?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((asset) => (
                    <div key={asset.id} className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                      {asset.mimeType.startsWith("image/") ? (
                        <div className="aspect-square bg-white/[0.04] flex items-center justify-center">
                          <img src={asset.url} alt={asset.alt ?? ""} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      ) : (
                        <div className="aspect-square bg-white/[0.04] flex items-center justify-center">
                          <FileText className="size-8 text-white/20" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs text-white/60 truncate">{asset.alt ?? asset.mimeType}</p>
                        <p className="text-[10px] text-white/30">{bytesToMB(asset.sizeBytes)} MB</p>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <a href={asset.url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20 transition">
                          <Download className="size-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <Image className="size-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">لا توجد ملفات وسائط</p>
                </div>
              )}
            </div>
          )}

          {/* ───── ACTIVITY ───── */}
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

          {/* ───── SESSIONS ───── */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {customer.sessions.length > 0 ? (
                customer.sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div className="shrink-0">
                      {s.userAgent?.includes("Mobile") ? <Smartphone className="size-4 text-white/30" /> :
                       s.userAgent?.includes("Tablet") ? <Monitor className="size-4 text-white/30" /> :
                       <Laptop className="size-4 text-white/30" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/80 truncate">
                        {s.ipAddress ?? "—"} · {s.userAgent?.slice(0, 50) ?? "—"}
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
                      <form action={async (fd) => {
                        fd.set("sessionId", s.id);
                        fd.set("tenantId", customer.id);
                        showConfirm("revoke-session", "إنهاء الجلسة", "سيتم إنهاء جلسة هذا الجهاز.", fd, true);
                      }}>
                        <button type="submit" className="text-xs text-white/30 hover:text-danger transition">
                          إنهاء
                        </button>
                      </form>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <Monitor className="size-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">لا توجد جلسات نشطة</p>
                </div>
              )}
            </div>
          )}

          {/* ───── NOTIFICATIONS ───── */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              {/* Send notification form */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-medium text-white/60 mb-4">إرسال إشعار جديد</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <select
                      value={notificationForm.type}
                      onChange={(e) => setNotificationForm((p) => ({ ...p, type: e.target.value }))}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none focus:border-champagne/50 transition"
                    >
                      <option value="info">معلومات</option>
                      <option value="warning">تحذير</option>
                      <option value="success">نجاح</option>
                      <option value="promotion">ترويجي</option>
                    </select>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="عنوان الإشعار"
                      className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50"
                    />
                  </div>
                  <textarea
                    value={notificationForm.body}
                    onChange={(e) => setNotificationForm((p) => ({ ...p, body: e.target.value }))}
                    placeholder="محتوى الإشعار"
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 resize-none"
                  />
                  <form action={async (fd) => {
                    fd.set("tenantId", customer.id);
                    fd.set("notificationType", notificationForm.type);
                    fd.set("title", notificationForm.title);
                    fd.set("body", notificationForm.body);
                    await handleAction("send-notification", fd);
                    setNotificationForm({ type: "info", title: "", body: "" });
                  }}>
                    <button
                      type="submit"
                      disabled={!notificationForm.title || !notificationForm.body}
                      className="flex items-center gap-2 rounded-xl bg-champagne px-4 py-2.5 text-sm font-semibold text-ink hover:bg-champagne/90 transition disabled:opacity-50"
                    >
                      <Send className="size-4" /> إرسال الإشعار
                    </button>
                  </form>
                </div>
              </div>

              {/* Notification history */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-medium text-white/60 mb-4">الإشعارات المرسلة</h3>
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <Bell className={`size-4 shrink-0 mt-0.5 ${n.readAt ? "text-white/20" : "text-champagne"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white/80">{n.title}</p>
                          <p className="text-xs text-white/40">{n.body}</p>
                          <p className="text-[10px] text-white/30 mt-1">{formatDateTime(n.createdAt)} · {n.priority}</p>
                        </div>
                        {n.readAt && <span className="text-[10px] text-white/30 shrink-0">مقروء</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/35">لا توجد إشعارات مرسلة</p>
                )}
              </div>
            </div>
          )}

          {/* ───── AUDIT ───── */}
          {activeTab === "audit" && (
            <div className="space-y-4">
              {customer.recentActivity.length > 0 ? (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="space-y-2">
                    {customer.recentActivity.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                        <Shield className="size-4 text-white/20 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white/80">{a.action}</p>
                          <p className="text-xs text-white/40">
                            {a.entityType}{a.entityId ? ` #${a.entityId.slice(0, 8)}` : ""} · {a.actorName ?? "النظام"}
                          </p>
                          {a.metadata && (
                            <pre className="text-[10px] text-white/30 mt-1 overflow-x-auto">
                              {JSON.stringify(a.metadata, null, 1).slice(0, 200)}
                            </pre>
                          )}
                        </div>
                        <span className="text-[10px] text-white/30 shrink-0">{formatDateTime(a.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <Shield className="size-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">لا توجد عمليات تدقيق</p>
                </div>
              )}
            </div>
          )}

          {/* ───── NOTES ───── */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="text-sm font-medium text-white/60 mb-4">إضافة ملاحظة</h3>
                <form action={async (fd) => {
                  fd.set("tenantId", customer.id);
                  fd.set("body", noteBody);
                  await handleAction("create-note", fd);
                  setNoteBody("");
                }}>
                  <textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="اكتب ملاحظة داخلية..."
                    rows={3}
                    className="w-full rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-champagne/50 resize-none mb-3"
                  />
                  <button
                    type="submit"
                    disabled={!noteBody.trim()}
                    className="flex items-center gap-2 rounded-xl bg-champagne px-4 py-2.5 text-sm font-semibold text-ink hover:bg-champagne/90 transition disabled:opacity-50"
                  >
                    إضافة ملاحظة
                  </button>
                </form>
              </div>

              {/* Notes list */}
              {adminNotes.length > 0 ? (
                <div className="space-y-2">
                  {adminNotes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{note.body}</p>
                        <form action={async (fd) => {
                          fd.set("noteId", note.id);
                          fd.set("tenantId", customer.id);
                          showConfirm("delete-note", "حذف الملاحظة", "سيتم حذف هذه الملاحظة بشكل دائم.", fd, true);
                        }}>
                          <button type="submit" className="text-white/20 hover:text-danger transition shrink-0">
                            <Trash2 className="size-3.5" />
                          </button>
                        </form>
                      </div>
                      <p className="text-[10px] text-white/30 mt-2">{note.authorName ?? "مشرف"} · {formatDateTime(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <BookOpen className="size-8 text-white/20 mx-auto mb-3" />
                  <p className="text-sm text-white/40">لا توجد ملاحظات داخلية</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">حالة العميل</h3>
            <div className="space-y-2">
              <StatusSection label="الحساب" value={customer.status} tone={statusTone[customer.status] || "default"} />
              <StatusSection label="الموقع" value={customer.sites[0]?.isPublished ? "منشور" : "مسودة"} tone={customer.sites[0]?.isPublished ? "success" : "default"} />
              {customer.subscription && (
                <StatusSection label="الاشتراك" value={customer.subscription.status} tone={subStatusTone[customer.subscription.status] || "default"} />
              )}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <span className="text-sm text-white/60">الأيام المتبقية</span>
                <span className={`text-sm font-medium ${daysRemaining > 0 ? "text-white/80" : "text-danger"}`}>
                  {daysRemaining > 0 ? `${daysRemaining} يوماً` : "منتهي"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">معلومات إضافية</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-white/40">آخر نشاط</p>
                <p className="text-sm text-white/80">{formatDateTime(customer.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">آخر تعديل</p>
                <p className="text-sm text-white/80">{formatDateTime(customer.updatedAt)}</p>
              </div>
              {customer.subscription && (
                <>
                  <div>
                    <p className="text-xs text-white/40">القالب الحالي</p>
                    <p className="text-sm text-white/80">{customer.subscription.planName ?? "بدون خطة"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">المساحة المستخدمة</p>
                    <p className="text-sm text-white/80">{bytesToMB(customer.stats.totalStorageBytes)} MB</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-white/40">عدد الجلسات</p>
                <p className="text-sm text-white/80">{customer.sessions.filter((s) => !s.isRevoked).length} نشطة</p>
              </div>
            </div>
          </div>

          {/* Quick nav */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">تنقل سريع</h3>
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                      activeTab === tab.id ? "bg-champagne/10 text-champagne" : "text-white/40 hover:text-white/60 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── CONFIRMATION DIALOG ─── */}
      {confirmAction && (
        <AdminConfirmDialog
          open
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.danger ? "danger" : "warning"}
          onConfirm={confirmAndExecute}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
