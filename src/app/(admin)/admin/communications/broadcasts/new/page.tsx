import { randomUUID } from "node:crypto";

import { Send } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { BrowserTimezoneOffset } from "@/components/communication/customer-composer-form";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";

import { publishCommunicationBroadcastAction } from "../actions";

export default async function NewCommunicationBroadcastPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdminPermission("messages", "edit");
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : null;
  return (
    <AdminPageShell badge="Broadcast" title="إعلان جديد" description="حدّد الجمهور مرة واحدة؛ سيظهر المحتوى داخل Inbox كل عميل دون إنشاء نسخة نص لكل مستلم." breadcrumbs={[{ label: "التواصل", href: "/admin/communications" }, { label: "الإعلانات", href: "/admin/communications/broadcasts" }, { label: "جديد" }]} backHref="/admin/communications/broadcasts">
      {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">{decodeURIComponent(error)}</p> : null}
      <form action={publishCommunicationBroadcastAction} className="mx-auto grid w-full max-w-3xl gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <input type="hidden" name="idempotencyKey" value={randomUUID()} />
        <BrowserTimezoneOffset />
        <label className="grid gap-2 text-xs font-black text-white/60">نوع الرسالة<select name="typeKey" className="min-h-11 rounded-xl border border-white/10 bg-[#11141b] px-3 text-sm text-white"><option value="announcement.update">تحديث</option><option value="announcement.maintenance">صيانة</option><option value="announcement.feature">ميزة جديدة</option><option value="announcement.notice">إشعار عام</option><option value="announcement.alert">تنبيه مهم</option></select></label>
        <label className="grid gap-2 text-xs font-black text-white/60">العنوان<input name="subject" required maxLength={180} className="min-h-11 rounded-xl border border-white/10 bg-black/15 px-3 text-sm text-white outline-none" /></label>
        <label className="grid gap-2 text-xs font-black text-white/60">النص<textarea name="body" required maxLength={20000} rows={8} className="rounded-xl border border-white/10 bg-black/15 p-3 text-sm font-bold leading-7 text-white outline-none" /></label>
        <label className="grid gap-2 text-xs font-black text-white/60">الجمهور<select name="audienceMode" className="min-h-11 rounded-xl border border-white/10 bg-[#11141b] px-3 text-sm text-white"><option value="ALL">كل العملاء</option><option value="TRIAL">التجريبيون فقط</option><option value="SUBSCRIBED">المشتركون النشطون</option><option value="EXPIRED">المنتهية اشتراكاتهم</option><option value="EXPLICIT">عملاء محددون</option></select></label>
        <label className="grid gap-2 text-xs font-black text-white/60">معرفات العملاء المحددين — عند اختيار «عملاء محددون»<textarea name="tenantIds" rows={3} placeholder="tenant-id-1, tenant-id-2" className="rounded-xl border border-white/10 bg-black/15 p-3 text-xs text-white outline-none" /></label>
        <label className="grid gap-2 text-xs font-black text-white/60">موعد النشر — اتركه فارغًا للنشر الآن<input name="scheduledAt" type="datetime-local" className="min-h-11 rounded-xl border border-white/10 bg-[#11141b] px-3 text-sm text-white" /></label>
        <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-300 px-5 text-sm font-black text-[#17111f]"><Send className="size-4" /> نشر الإعلان</button>
      </form>
    </AdminPageShell>
  );
}
