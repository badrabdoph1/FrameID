import { ImageIcon, Save, Sparkles } from "lucide-react";

import { saveStarterDefaultsAction } from "@/app/(admin)/admin/templates/starter-defaults-actions";
import type { TemplateStarterSharedDefaults } from "@/modules/themes/template-starter-defaults";

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";

export function StarterDefaultsCard({ defaults }: { defaults: TemplateStarterSharedDefaults }) {
  return (
    <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><Sparkles className="size-5" /></span>
        <div>
          <p className="text-xs font-black text-[#f3cf73]">مصدر محتوى القوالب</p>
          <h2 className="mt-1 text-lg font-black text-[#fff7e8]">محتوى البداية المشترك</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-6 text-white/45">نقطة إدارة واحدة للبيانات المشتركة. كل قالب حالي أو جديد يرث هذه القيم تلقائيًا، ولا يستخدم استثناء إلا عند الحاجة.</p>
        </div>
      </div>

      <form action={saveStarterDefaultsAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="اسم المصور الافتراضي">
          <input name="photographerName" required defaultValue={defaults.photographerName} className={inputClass} />
        </Field>
        <Field label="اسم الاستوديو الافتراضي">
          <input name="studioName" required defaultValue={defaults.studioName} className={inputClass} />
        </Field>
        <Field label="الوصف الافتراضي" wide>
          <textarea name="description" required rows={3} defaultValue={defaults.description} className={`${inputClass} min-h-24 py-3`} />
        </Field>
        <Field label="صورة Hero المشتركة — اختيارية" wide>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/35"><ImageIcon className="size-4" /></span>
            <input name="heroImageUrl" defaultValue={defaults.heroImageUrl ?? ""} className={inputClass} placeholder="اتركها فارغة ليستخدم كل قالب صورته الحالية" />
          </div>
        </Field>
        <div className="sm:col-span-2">
          <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg sm:w-auto">
            <Save className="size-4" /> حفظ البيانات المشتركة
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? "grid gap-1.5 sm:col-span-2" : "grid gap-1.5"}><span className="text-xs font-black text-white/55">{label}</span>{children}</label>;
}
