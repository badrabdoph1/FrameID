"use client"

import { RefreshCw, PlayCircle, PauseCircle, XCircle, CheckCircle2, KeyRound, Eye, Send, Mail, MessageSquare, Archive, Trash2, Zap, Copy } from "lucide-react"
import type { CustomerDetail } from "./customer-types"

type QuickActionsProps = {
  customer: CustomerDetail
  siteUrl: string | null
  onAction: (type: string, title: string, description: string, formData: FormData, danger?: boolean) => void
  onCopy: (text: string) => void
  onNotify: () => void
  onEmail: () => void
}

export function CustomerQuickActions({ customer, siteUrl, onAction, onCopy, onNotify, onEmail }: QuickActionsProps) {
  const randomPassword = () => Array.from({ length: 16 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*".charAt(Math.floor(Math.random() * 70))).join("")

  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/8 bg-white/3 p-2.5">
      <span className="flex items-center gap-1 px-2 text-[0.65rem] font-extrabold text-white/40"><Zap size={12} />إجراءات سريعة</span>

      <form action={async (fd) => { fd.set("tenantId", customer.id); fd.set("days", "14"); onAction("extend-trial", "تمديد التجربة", `تمديد تجربة ${customer.displayName} لمدة 14 يوماً إضافية؟`, fd) }}>
        <ActionBtn type="submit"><RefreshCw size={13} /> تمديد التجربة</ActionBtn>
      </form>

      {customer.status !== "ACTIVE" && (
        <form action={async (fd) => { fd.set("customerId", customer.id); onAction("activate", "تفعيل الحساب", `تفعيل حساب ${customer.displayName}؟`, fd) }}>
          <ActionBtn type="submit" className="text-emerald-400/70 hover:border-emerald-400/30 hover:text-emerald-400"><PlayCircle size={13} /> تفعيل</ActionBtn>
        </form>
      )}

      {customer.status !== "SUSPENDED" && (
        <form action={async (fd) => { fd.set("customerId", customer.id); fd.set("reason", "إيقاف بواسطة المشرف"); onAction("suspend", "إيقاف الحساب", `سيتم إيقاف حساب ${customer.displayName}.`, fd, true) }}>
          <ActionBtn type="submit" className="text-amber-400/70 hover:border-amber-400/30 hover:text-amber-400"><PauseCircle size={13} /> إيقاف</ActionBtn>
        </form>
      )}

      {customer.status === "SUSPENDED" && (
        <form action={async (fd) => { fd.set("customerId", customer.id); onAction("activate", "تشغيل الحساب", `تشغيل حساب ${customer.displayName}؟`, fd) }}>
          <ActionBtn type="submit" className="text-emerald-400/70 hover:border-emerald-400/30 hover:text-emerald-400"><PlayCircle size={13} /> تشغيل</ActionBtn>
        </form>
      )}

      {customer.sites[0] && (
        <form action={async (fd) => { fd.set("siteId", customer.sites[0].id); fd.set("tenantId", customer.id); const pub = customer.sites[0].isPublished; fd.set("publish", pub ? "false" : "true"); onAction("publish-site", pub ? "إيقاف الموقع" : "نشر الموقع", pub ? "سيتم إخفاء الموقع عن الزوار." : "سيتم نشر الموقع للزوار.", fd, pub) }}>
          <ActionBtn type="submit">{customer.sites[0].isPublished ? <XCircle size={13} /> : <CheckCircle2 size={13} />} {customer.sites[0].isPublished ? "إيقاف الموقع" : "تشغيل الموقع"}</ActionBtn>
        </form>
      )}

      <form action={async (fd) => { fd.set("userId", customer.owner.id); fd.set("newPassword", randomPassword()); onAction("reset-password", "إعادة تعيين كلمة المرور", `سيتم إعادة تعيين كلمة مرور حساب ${customer.owner.email}.`, fd, true) }}>
        <ActionBtn type="submit"><KeyRound size={13} /> إعادة كلمة المرور</ActionBtn>
      </form>

      <form action={async (fd) => { fd.set("tenantId", customer.id); onAction("impersonate", "انتحال صفة العميل", `سيتم تسجيل الدخول باسم ${customer.displayName}.`, fd, true) }}>
        <ActionBtn type="submit" className="text-amber-400/70 hover:border-amber-400/30 hover:text-amber-400"><Eye size={13} /> impersonation</ActionBtn>
      </form>

      <button type="button" onClick={onNotify} className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2 py-1.5 text-[0.7rem] font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73] whitespace-nowrap">
        <Send size={13} /> إرسال إشعار
      </button>

      <button type="button" onClick={onEmail} className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2 py-1.5 text-[0.7rem] font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73] whitespace-nowrap">
        <Mail size={13} /> إرسال بريد
      </button>

      {customer.owner.phone && (
        <a href={`https://wa.me/${customer.owner.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2 py-1.5 text-[0.7rem] font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73] whitespace-nowrap no-underline">
          <MessageSquare size={13} /> واتساب
        </a>
      )}

      {siteUrl && (
        <a href={siteUrl} target="_blank" rel="noopener noreferrer" onClick={() => onCopy(siteUrl)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2 py-1.5 text-[0.7rem] font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73] whitespace-nowrap no-underline">
          <Copy size={13} /> نسخ الرابط
        </a>
      )}

      <form action={async (fd) => { fd.set("customerId", customer.id); onAction("archive", "أرشفة العميل", "سيتم إخفاء العميل ومواقعه عن لوحة التحكم.", fd) }}>
        <ActionBtn type="submit"><Archive size={13} /> أرشفة</ActionBtn>
      </form>

      <form action={async (fd) => { fd.set("customerId", customer.id); onAction("delete", "حذف العميل نهائياً", `سيتم حذف ${customer.displayName} و ${customer.stats.sitesCount} موقع وجميع البيانات المرتبطة. هذا الإجراء لا يمكن التراجع عنه.`, fd, true) }}>
        <ActionBtn type="submit" className="text-red-400/60 hover:border-red-400/40 hover:text-red-400"><Trash2 size={13} /> حذف</ActionBtn>
      </form>
    </div>
  )
}

function ActionBtn({ type, className, children }: { type?: "submit" | "button"; className?: string; children: React.ReactNode }) {
  return (
    <button type={type || "submit"} className={`inline-flex items-center gap-1.5 rounded-lg border border-white/8 px-2 py-1.5 text-[0.7rem] font-extrabold text-white/50 transition hover:border-amber-500/30 hover:text-[#f3cf73] whitespace-nowrap ${className || ""}`}>
      {children}
    </button>
  )
}
