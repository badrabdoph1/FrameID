"use client";

import Link from "next/link";
import { CheckCircle2, Eye, Monitor, Palette, Smartphone, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { selectTemplateAction } from "@/app/(dashboard)/dashboard/design/actions";
import type { TemplateSummary } from "@/modules/themes/theme-registry";

type TemplatesClientProps = {
  templates: TemplateSummary[];
  currentThemeName: string | null;
  currentThemeCode: string | null;
};

export function TemplatesClient({ templates, currentThemeName, currentThemeCode }: TemplatesClientProps) {
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.48fr] lg:items-stretch">
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">شكل الموقع</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">اختار شكل يليق بشغلك</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              القالب بيغيّر شكل العرض بس. صورك، بياناتك، وأسعارك هتفضل محفوظة، وتقدر تبدّل القالب في أي وقت.
            </p>
          </div>
          <div className="rounded-[1.25rem] border border-amber-300/18 bg-amber-300/10 p-4">
            <p className="text-xs font-black text-[#f3cf73]">القالب الحالي</p>
            <h2 className="mt-1 text-xl font-black text-[#fff7e8]">{currentThemeName ?? "لسه مفيش قالب"}</h2>
            <p className="mt-2 text-xs font-bold leading-6 text-white/52">
              {currentThemeCode ? "القالب ده ظاهر حاليًا للزوار." : "اختار قالب كبداية، وبعدها عاين موقعك من صفحة النشر."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Palette className="size-5" /></span>
          <div>
            <h2 className="text-base font-black text-[#fff7e8]">القوالب المتاحة</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">عاين القالب على شكل موبايل وديسكتوب قبل التشغيل.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.code} template={template} isCurrent={template.themeCode === currentThemeCode} />
          ))}
        </div>
      </section>
    </main>
  );
}

function TemplateCard({ template, isCurrent }: { template: TemplateSummary; isCurrent: boolean }) {
  const palette = template.themeCode === "noir-gold" ? ["#0b0d12", "#f3cf73", "#fff7e8"] : ["#fff4f5", "#d88a9a", "#34252a"];

  return (
    <article className={isCurrent ? "overflow-hidden rounded-[1.35rem] border border-amber-300/35 bg-amber-300/8" : "overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/16"}>
      <div className="relative min-h-[220px] overflow-hidden border-b border-white/8 bg-black/20 p-3">
        {isCurrent ? (
          <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-300 px-3 py-1 text-xs font-black text-black">
            <CheckCircle2 className="size-3.5" aria-hidden />
            شغال الآن
          </span>
        ) : null}
        <div className="absolute inset-4 rounded-2xl border border-white/10 p-3 shadow-2xl" style={{ background: palette[0] }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1.5"><span className="size-2 rounded-full bg-white/30" /><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/10" /></div>
            <Monitor className="size-4 text-white/45" aria-hidden />
          </div>
          <div className="grid grid-cols-[1.4fr_0.8fr] gap-3">
            <div>
              <div className="mb-3 h-5 w-28 rounded-full" style={{ background: palette[1] }} />
              <div className="mb-2 h-3 w-full rounded-full bg-white/35" />
              <div className="mb-4 h-3 w-4/5 rounded-full bg-white/20" />
              <div className="grid grid-cols-3 gap-2"><span className="aspect-square rounded-lg bg-white/15" /><span className="aspect-square rounded-lg bg-white/25" /><span className="aspect-square rounded-lg bg-white/15" /></div>
            </div>
            <div className="relative mx-auto h-32 w-16 rounded-2xl border border-white/20 bg-black/25 p-1">
              <Smartphone className="absolute -top-6 left-1/2 size-4 -translate-x-1/2 text-white/45" aria-hidden />
              <div className="size-full rounded-xl" style={{ background: palette[2] }}>
                <div className="mx-auto mt-2 h-2 w-8 rounded-full" style={{ background: palette[1] }} />
                <div className="mx-2 mt-3 aspect-square rounded-lg bg-black/20" />
                <div className="mx-2 mt-2 h-2 rounded-full bg-black/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#fff7e8]">{template.name}</h3>
            <p className="mt-1 text-sm font-bold leading-7 text-white/52">{template.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {palette.map((color) => <span key={color} className="size-6 rounded-full border border-white/10" style={{ background: color }} title={color} />)}
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.68rem] font-black text-white/45">موبايل</span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[0.68rem] font-black text-white/45">ديسكتوب</span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Link href={`/templates/${template.code}/preview`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/[0.08] hover:text-white">
            <Eye className="size-4" aria-hidden />
            معاينة
          </Link>
          <form action={selectTemplateAction}>
            <input name="templateCode" type="hidden" value={template.code} />
            <Button type="submit" variant={isCurrent ? "secondary" : "luxury"} className="min-h-11 w-full rounded-2xl font-black" disabled={isCurrent}>
              <WandSparkles className="size-4" aria-hidden />
              {isCurrent ? "مفعل" : "شغّل القالب"}
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}
