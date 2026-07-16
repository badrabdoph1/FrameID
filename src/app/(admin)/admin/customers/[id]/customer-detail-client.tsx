"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Activity, Bell, CreditCard, Globe } from "lucide-react";
import { AdminConfirmDialog } from "@/components/layout/admin-confirm-dialog";
import { buildPublicSiteUrl } from "@/lib/public-site-url";
import type {
  CustomerAdminNote,
  CustomerDetail,
  CustomerMediaAsset,
  CustomerNotification,
  CustomerSubscriptionInfo,
} from "@/modules/admin/customers/customer-types";
import type { CustomerPlanOption } from "@/modules/admin/customers/customer-subscription-editor";

import { CustomerInfoPanel } from "./components/customer-info-panel";
import { CustomerQuickActions } from "./components/customer-quick-actions";
import { CustomerTabBar, type CustomerWorkspaceId } from "./components/customer-tabs";
import { CustomerOverviewTab } from "./components/customer-overview-tab";
import { CustomerWebsiteTab } from "./components/customer-website-tab";
import { CustomerSubscriptionTab } from "./components/customer-subscription-tab";
import { CustomerPaymentsTab } from "./components/customer-payments-tab";
import { CustomerMediaTab } from "./components/customer-media-tab";
import { CustomerSessionsTab } from "./components/customer-sessions-tab";
import { CustomerNotificationsTab } from "./components/customer-notifications-tab";
import { CustomerNotesTab } from "./components/customer-notes-tab";
import { CustomerPasswordCard } from "./components/customer-password-card";

import {
  activateCustomerAction,
  activateCustomerSubscriptionAction,
  archiveCustomerAction,
  cancelCustomerSubscriptionAction,
  createAdminNoteAction,
  deleteAdminNoteAction,
  deleteCustomerAction,
  editCustomerSubscriptionAction,
  extendCustomerTrialAction,
  publishSiteAction,
  resetCustomerPasswordAction,
  revokeSessionAction,
  sendNotificationAction,
  suspendCustomerAction,
  suspendSiteAction,
} from "@/app/(admin)/admin/customers/actions";

type Props = {
  initialTab: CustomerWorkspaceId;
  customer: CustomerDetail;
  platformBaseUrl: string;
  media: CustomerMediaAsset[];
  notifications: CustomerNotification[];
  adminNotes: CustomerAdminNote[];
  allSubscriptions: CustomerSubscriptionInfo[];
  plans: CustomerPlanOption[];
};

type FeedbackMessage = { type: "success" | "error"; text: string };
type ConfirmAction = { type: string; title: string; description: string; danger?: boolean; formData?: FormData };
type ClipboardTarget = "site" | "password";

const actionFeedback: Record<string, { success: string; error: string }> = {
  suspend: { success: "تم إيقاف حساب العميل", error: "تعذر إيقاف الحساب. حاول مرة أخرى." },
  activate: { success: "تم تفعيل حساب العميل", error: "تعذر تفعيل الحساب. حاول مرة أخرى." },
  archive: { success: "تمت أرشفة العميل", error: "تعذرت أرشفة العميل. حاول مرة أخرى." },
  delete: { success: "تم حذف العميل", error: "تعذر حذف العميل. راجع سجل المشاكل قبل المحاولة مجددًا." },
  "reset-password": { success: "تم حفظ كلمة المرور الجديدة", error: "تعذر تغيير كلمة المرور. تحقق من البيانات وحاول مرة أخرى." },
  "extend-trial": { success: "تم تمديد فترة التجربة", error: "تعذر تمديد فترة التجربة. حاول مرة أخرى." },
  "activate-subscription": { success: "تم تفعيل الاشتراك", error: "تعذر تفعيل الاشتراك. حاول مرة أخرى." },
  "cancel-subscription": { success: "تم إلغاء الاشتراك", error: "تعذر إلغاء الاشتراك. حاول مرة أخرى." },
  "edit-subscription": { success: "تم حفظ الاشتراك وتحديث حالة العميل", error: "تعذر حفظ الاشتراك. راجع الباقة والمدة وحاول مرة أخرى." },
  "publish-site": { success: "تم تحديث حالة نشر الموقع", error: "تعذر تحديث حالة الموقع. حاول مرة أخرى." },
  "suspend-site": { success: "تم تحديث حالة الموقع", error: "تعذر تحديث حالة الموقع. حاول مرة أخرى." },
  "revoke-session": { success: "تم إنهاء جلسة الدخول", error: "تعذر إنهاء جلسة الدخول. حاول مرة أخرى." },
  "create-note": { success: "تمت إضافة الملاحظة", error: "تعذرت إضافة الملاحظة. حاول مرة أخرى." },
  "delete-note": { success: "تم حذف الملاحظة", error: "تعذر حذف الملاحظة. حاول مرة أخرى." },
  "send-notification": { success: "تم إرسال الإشعار", error: "تعذر إرسال الإشعار. تحقق من العنوان والمحتوى وحاول مرة أخرى." },
};

const clipboardFeedback: Record<ClipboardTarget, { success: string; error: string }> = {
  site: {
    success: "تم نسخ رابط الموقع",
    error: "تعذر نسخ رابط الموقع. افتح الموقع وانسخ الرابط من شريط العنوان.",
  },
  password: {
    success: "تم نسخ كلمة المرور",
    error: "تعذر نسخ كلمة المرور. حدّدها وانسخها يدويًا.",
  },
};

const confirmLabels: Record<string, string> = {
  suspend: "إيقاف الحساب",
  activate: "تفعيل الحساب",
  archive: "أرشفة العميل",
  delete: "حذف العميل",
  "reset-password": "تغيير كلمة المرور",
  "extend-trial": "تمديد التجربة",
  "activate-subscription": "تفعيل الاشتراك",
  "cancel-subscription": "إلغاء الاشتراك",
  "edit-subscription": "حفظ الاشتراك",
  "publish-site": "تحديث الموقع",
  "suspend-site": "تحديث الموقع",
  "revoke-session": "إنهاء الجلسة",
  "delete-note": "حذف الملاحظة",
};

function daysLeft(value: string | null): string {
  if (!value) return "—";
  const diff = new Date(value).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  if (days < 0) return `منتهي منذ ${Math.abs(days)} يوم`;
  if (days === 0) return "ينتهي اليوم";
  return `${days} يوم متبقي`;
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString("ar-EG")} ج.م`;
}

function customerStatusLabel(status: CustomerDetail["status"]) {
  const labels: Record<CustomerDetail["status"], string> = {
    ACTIVE: "نشط",
    TRIAL: "تجريبي",
    SUSPENDED: "موقوف",
    EXPIRED: "منتهي",
    TRIAL_EXPIRED: "انتهت التجربة",
    ARCHIVED: "مؤرشف",
  };
  return labels[status];
}

export function CustomerDetailClient({
  initialTab,
  customer,
  platformBaseUrl,
  media,
  notifications,
  adminNotes,
  allSubscriptions,
  plans,
}: Props) {
  const router = useRouter();
  const [activeWorkspace, setActiveWorkspace] = useState<CustomerWorkspaceId>(initialTab);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setActiveWorkspace(initialTab);
  }, [initialTab]);

  const showMsg = useCallback((type: FeedbackMessage["type"], text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 5000);
  }, []);

  const changeWorkspace = useCallback((workspace: CustomerWorkspaceId) => {
    setActiveWorkspace(workspace);
    router.replace(`/admin/customers/${customer.id}?tab=${workspace}`);
  }, [customer.id, router]);

  const handleAction = useCallback(async (actionType: string, formData: FormData) => {
    try {
      const actions: Record<string, (data: FormData) => Promise<void>> = {
        suspend: suspendCustomerAction,
        activate: activateCustomerAction,
        archive: archiveCustomerAction,
        delete: deleteCustomerAction,
        "reset-password": resetCustomerPasswordAction,
        "extend-trial": extendCustomerTrialAction,
        "activate-subscription": activateCustomerSubscriptionAction,
        "cancel-subscription": cancelCustomerSubscriptionAction,
        "edit-subscription": editCustomerSubscriptionAction,
        "publish-site": publishSiteAction,
        "suspend-site": suspendSiteAction,
        "revoke-session": revokeSessionAction,
        "create-note": createAdminNoteAction,
        "delete-note": deleteAdminNoteAction,
        "send-notification": sendNotificationAction,
      };

      const action = actions[actionType];
      if (!action) throw new Error(`Unknown customer action: ${actionType}`);
      await action(formData);
      showMsg("success", actionFeedback[actionType]?.success ?? "تم تنفيذ العملية");
      router.refresh();
      return true;
    } catch {
      showMsg("error", actionFeedback[actionType]?.error ?? "تعذر تنفيذ العملية. حاول مرة أخرى.");
      return false;
    }
  }, [router, showMsg]);

  const showConfirm = useCallback((type: string, title: string, description: string, formData: FormData, danger?: boolean) => {
    setConfirmAction({ type, title, description, danger, formData });
  }, []);

  const confirmAndExecute = useCallback(async () => {
    if (!confirmAction?.formData) return;
    const { type, formData } = confirmAction;
    setConfirmAction(null);
    await handleAction(type, formData);
  }, [confirmAction, handleAction]);

  const copyToClipboard = useCallback(async (text: string, target: ClipboardTarget) => {
    const feedback = clipboardFeedback[target];
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      showMsg("success", feedback.success);
    } catch {
      showMsg("error", feedback.error);
    }
  }, [showMsg]);

  const handlePasswordReset = useCallback((userId: string, newPassword: string) => {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("newPassword", newPassword);
    showConfirm(
      "reset-password",
      "تأكيد تغيير كلمة المرور",
      `سيتم استبدال كلمة مرور حساب ${customer.owner.email} فور التأكيد.`,
      formData,
      true,
    );
  }, [customer.owner.email, showConfirm]);

  const handleNotificationSend = useCallback((type: string, title: string, body: string) => {
    const formData = new FormData();
    formData.set("tenantId", customer.id);
    formData.set("notificationType", type);
    formData.set("title", title);
    formData.set("body", body);
    return handleAction("send-notification", formData);
  }, [customer.id, handleAction]);

  const handleAddNote = useCallback((body: string) => {
    const formData = new FormData();
    formData.set("tenantId", customer.id);
    formData.set("body", body);
    void handleAction("create-note", formData);
  }, [customer.id, handleAction]);

  const handleDeleteNote = useCallback((noteId: string) => {
    const formData = new FormData();
    formData.set("noteId", noteId);
    showConfirm(
      "delete-note",
      "حذف الملاحظة",
      "سيتم حذف هذه الملاحظة الإدارية نهائيًا.",
      formData,
      true,
    );
  }, [showConfirm]);

  const siteSlug = customer.sites[0]?.slug ?? "";
  const siteUrl = siteSlug ? buildPublicSiteUrl(platformBaseUrl, siteSlug) : null;
  const metrics = [
    { label: "الحساب", value: customerStatusLabel(customer.status), icon: Activity },
    { label: "التجربة", value: daysLeft(customer.trialEndsAt), icon: Bell },
    { label: "المواقع", value: customer.stats.sitesCount.toLocaleString("ar-EG"), icon: Globe },
    { label: "الإيرادات", value: formatMoney(customer.stats.totalRevenue), icon: CreditCard },
    { label: "الدعم", value: customer.stats.supportCasesCount.toLocaleString("ar-EG"), icon: Bell, danger: customer.stats.supportCasesCount > 0 },
  ];

  return (
    <div className="space-y-4">
      {message ? (
        <div role="status" aria-live="polite" aria-atomic="true" className={`rounded-xl border px-4 py-3 text-sm font-extrabold ${
          message.type === "success"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            : "border-red-500/20 bg-red-500/10 text-red-300"
        }`}>
          {message.text}
        </div>
      ) : null}

      <section aria-label="ملخص حالة العميل" className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={`flex min-h-14 items-center gap-2.5 rounded-xl border px-3 py-2.5 ${metric.danger ? "border-red-300/20 bg-red-400/[0.05]" : "border-white/8 bg-white/[0.025]"}`}>
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${metric.danger ? "bg-red-400/10 text-red-300" : "bg-white/5 text-white/30"}`}>
                <Icon aria-hidden="true" size={15} />
              </span>
              <div className="min-w-0">
                <p className={`truncate text-sm font-black tabular-nums ${metric.danger ? "text-red-300" : "text-[#fff7e8]"}`}>{metric.value}</p>
                <p className="mt-0.5 text-[0.68rem] font-black text-white/35">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      <CustomerTabBar activeTab={activeWorkspace} basePath={`/admin/customers/${customer.id}`} onChange={setActiveWorkspace} />

      {activeWorkspace === "overview" ? (
        <section aria-label="مساحة الملخص والإجراءات" className="space-y-4">
          <CustomerInfoPanel customer={customer} />
          <CustomerQuickActions
            customer={customer}
            siteUrl={siteUrl}
            onAction={showConfirm}
            onCopy={(text) => copyToClipboard(text, "site")}
            onNotify={() => changeWorkspace("support")}
            onEmail={() => { window.location.href = `mailto:${customer.owner.email}`; }}
            onSecurity={() => changeWorkspace("support")}
          />
          <CustomerOverviewTab customer={customer} platformBaseUrl={platformBaseUrl} onTabChange={changeWorkspace} />
        </section>
      ) : null}

      {activeWorkspace === "site" ? (
        <section aria-label="مساحة الموقع والملفات" className="space-y-4">
          <WorkspaceSection title="إدارة الموقع والملفات" description="النشر والنطاقات ومحتوى الموقع في مكان واحد.">
            <CustomerWebsiteTab customer={customer} platformBaseUrl={platformBaseUrl} onAction={showConfirm} />
          </WorkspaceSection>
          <WorkspaceSection title="الوسائط والملفات" description="ابحث في ملفات العميل وافتحها أو نزّلها.">
            <CustomerMediaTab media={media} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </WorkspaceSection>
        </section>
      ) : null}

      {activeWorkspace === "billing" ? (
        <section aria-label="مساحة الاشتراك والمدفوعات" className="space-y-4">
          <WorkspaceSection title="إدارة الاشتراك والمدفوعات" description="حالة الاشتراك والتجربة والمدة والسجل المالي معًا.">
            <CustomerSubscriptionTab customer={customer} allSubscriptions={allSubscriptions} plans={plans} onAction={showConfirm} />
          </WorkspaceSection>
          <WorkspaceSection title="سجل المدفوعات" description="الطلبات والمبالغ والإثباتات والمراجعات.">
            <CustomerPaymentsTab customer={customer} />
          </WorkspaceSection>
        </section>
      ) : null}

      {activeWorkspace === "support" ? (
        <section aria-label="مساحة الدعم والحماية" className="space-y-4">
          <WorkspaceSection title="الدخول والحماية" description="كلمة المرور والجلسات النشطة في مكان واحد.">
            <div className="space-y-3">
              <CustomerPasswordCard
                ownerEmail={customer.owner.email}
                ownerId={customer.owner.id}
                onReset={handlePasswordReset}
                onCopy={(text) => copyToClipboard(text, "password")}
              />
              <CustomerSessionsTab customer={customer} onAction={showConfirm} />
            </div>
          </WorkspaceSection>
          <WorkspaceSection title="التواصل والمتابعة" description="الإشعارات والملاحظات الإدارية معًا.">
            <div className="space-y-4">
              <CustomerNotificationsTab notifications={notifications} onSend={handleNotificationSend} />
              <CustomerNotesTab notes={adminNotes} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} />
            </div>
          </WorkspaceSection>
        </section>
      ) : null}

      <AdminConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmAndExecute}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        variant={confirmAction?.danger ? "danger" : "warning"}
        confirmLabel={confirmAction ? confirmLabels[confirmAction.type] ?? "تأكيد" : "تأكيد"}
        cancelLabel="إلغاء"
      />
    </div>
  );
}

function WorkspaceSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
      <header className="border-b border-white/7 px-3 py-2.5 sm:px-4">
        <h2 className="text-sm font-black text-[#fff7e8]">{title}</h2>
        <p className="mt-0.5 text-xs font-bold text-white/35">{description}</p>
      </header>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}
