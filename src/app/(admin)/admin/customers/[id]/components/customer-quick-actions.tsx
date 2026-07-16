"use client";

import type { ReactNode } from "react";
import {
  Archive,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Mail,
  MessageSquare,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import type { CustomerDetail } from "./customer-types";

type QuickActionsProps = {
  customer: CustomerDetail;
  siteUrl: string | null;
  onAction: (type: string, title: string, description: string, formData: FormData, danger?: boolean) => void;
  onCopy: (text: string) => void;
  onNotify: () => void;
  onEmail: () => void;
  onSecurity: () => void;
};

export function CustomerQuickActions({
  customer,
  siteUrl,
  onAction,
  onCopy,
  onNotify,
  onEmail,
  onSecurity,
}: QuickActionsProps) {
  const primarySite = customer.sites[0] ?? null;

  return (
    <section aria-label="مركز إجراءات العميل" className="overflow-hidden rounded-xl border border-white/8 bg-white/3">
      <div className="border-b border-white/7 px-3 py-2.5">
        <h2 className="text-sm font-black text-[#fff7e8]">مركز إجراءات العميل</h2>
        <p className="mt-0.5 text-xs font-bold text-white/35">الإجراءات المتشابهة مجمعة، والعمليات الحساسة منفصلة.</p>
      </div>

      <div className="divide-y divide-white/7">
        <ActionGroup label="الحساب والاشتراك">
          <form action={async (formData) => {
            formData.set("tenantId", customer.id);
            formData.set("days", "14");
            onAction("extend-trial", "تمديد التجربة", `تمديد تجربة ${customer.displayName} لمدة 14 يومًا إضافية؟`, formData);
          }}>
            <ActionButton type="submit"><RefreshCw aria-hidden="true" size={14} />تمديد التجربة</ActionButton>
          </form>

          {customer.status !== "ACTIVE" && customer.status !== "SUSPENDED" ? (
            <form action={async (formData) => {
              formData.set("customerId", customer.id);
              onAction("activate", "تفعيل الحساب", `تفعيل حساب ${customer.displayName}؟`, formData);
            }}>
              <ActionButton type="submit" tone="success"><PlayCircle aria-hidden="true" size={14} />تفعيل</ActionButton>
            </form>
          ) : null}

          {customer.status !== "SUSPENDED" ? (
            <form action={async (formData) => {
              formData.set("customerId", customer.id);
              formData.set("reason", "إيقاف بواسطة المشرف");
              onAction("suspend", "إيقاف الحساب", `سيتم إيقاف حساب ${customer.displayName}.`, formData, true);
            }}>
              <ActionButton type="submit" tone="warning"><PauseCircle aria-hidden="true" size={14} />إيقاف</ActionButton>
            </form>
          ) : (
            <form action={async (formData) => {
              formData.set("customerId", customer.id);
              onAction("activate", "تشغيل الحساب", `تشغيل حساب ${customer.displayName}؟`, formData);
            }}>
              <ActionButton type="submit" tone="success"><PlayCircle aria-hidden="true" size={14} />تشغيل</ActionButton>
            </form>
          )}

          <ActionButton type="button" onClick={onSecurity}><KeyRound aria-hidden="true" size={14} />إعادة كلمة المرور</ActionButton>
        </ActionGroup>

        <ActionGroup label="الموقع">
          {siteUrl ? (
            <>
              <a href={siteUrl} target="_blank" rel="noopener noreferrer" className={actionClassName()}>
                <ExternalLink aria-hidden="true" size={14} />فتح الموقع
              </a>
              <ActionButton type="button" onClick={() => onCopy(siteUrl)}><Copy aria-hidden="true" size={14} />نسخ الرابط</ActionButton>
            </>
          ) : (
            <span className="text-xs font-bold text-white/30">لا يوجد رابط موقع متاح.</span>
          )}

          {primarySite ? (
            <form action={async (formData) => {
              formData.set("siteId", primarySite.id);
              formData.set("tenantId", customer.id);
              formData.set("publish", primarySite.isPublished ? "false" : "true");
              onAction(
                "publish-site",
                primarySite.isPublished ? "إيقاف الموقع" : "نشر الموقع",
                primarySite.isPublished ? "سيتم إخفاء الموقع عن الزوار." : "سيتم نشر الموقع للزوار.",
                formData,
                primarySite.isPublished,
              );
            }}>
              <ActionButton type="submit">
                {primarySite.isPublished ? <XCircle aria-hidden="true" size={14} /> : <CheckCircle2 aria-hidden="true" size={14} />}
                {primarySite.isPublished ? "إيقاف الموقع" : "نشر الموقع"}
              </ActionButton>
            </form>
          ) : null}
        </ActionGroup>

        <ActionGroup label="التواصل">
          <ActionButton type="button" onClick={onNotify}><Send aria-hidden="true" size={14} />إرسال إشعار</ActionButton>
          <ActionButton type="button" onClick={onEmail}><Mail aria-hidden="true" size={14} />إرسال بريد</ActionButton>
          {customer.owner.phone ? (
            <a
              href={`https://wa.me/${customer.owner.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className={actionClassName()}
            >
              <MessageSquare aria-hidden="true" size={14} />واتساب
            </a>
          ) : <span className="text-xs font-bold text-white/30">لا يوجد رقم واتساب.</span>}
        </ActionGroup>

        <ActionGroup label="إجراءات حساسة" danger>
          <form action={async (formData) => {
            formData.set("customerId", customer.id);
            onAction("archive", "أرشفة العميل", "سيتم إخفاء العميل ومواقعه عن لوحة التحكم.", formData);
          }}>
            <ActionButton type="submit" tone="danger"><Archive aria-hidden="true" size={14} />أرشفة</ActionButton>
          </form>
          <form action={async (formData) => {
            formData.set("customerId", customer.id);
            onAction(
              "delete",
              "حذف العميل نهائيًا",
              `سيتم حذف ${customer.displayName} و${customer.stats.sitesCount} موقع وجميع البيانات المرتبطة. لا يمكن التراجع عن هذا الإجراء.`,
              formData,
              true,
            );
          }}>
            <ActionButton type="submit" tone="danger"><Trash2 aria-hidden="true" size={14} />حذف</ActionButton>
          </form>
        </ActionGroup>
      </div>
    </section>
  );
}

function ActionGroup({ label, danger = false, children }: { label: string; danger?: boolean; children: ReactNode }) {
  return (
    <div className="grid gap-2 px-3 py-2.5 sm:grid-cols-[8rem_1fr] sm:items-center">
      <h3 className={`text-xs font-black ${danger ? "text-red-300/75" : "text-white/45"}`}>{label}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function actionClassName(tone: "default" | "success" | "warning" | "danger" = "default") {
  const toneClass = tone === "success"
    ? "border-emerald-400/25 text-emerald-300 hover:bg-emerald-400/10"
    : tone === "warning"
      ? "border-amber-400/25 text-amber-300 hover:bg-amber-400/10"
      : tone === "danger"
        ? "border-red-400/25 text-red-300 hover:bg-red-400/10"
        : "border-white/10 text-white/60 hover:border-amber-300/30 hover:bg-amber-300/[0.06] hover:text-[#f3cf73]";

  return `inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border bg-black/10 px-3 text-xs font-extrabold no-underline transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 ${toneClass}`;
}

function ActionButton({
  type,
  tone = "default",
  onClick,
  children,
}: {
  type: "submit" | "button";
  tone?: "default" | "success" | "warning" | "danger";
  onClick?: () => void;
  children: ReactNode;
}) {
  return <button type={type} onClick={onClick} className={actionClassName(tone)}>{children}</button>;
}
