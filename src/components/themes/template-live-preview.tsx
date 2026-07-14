import type { TemplateSummary } from "@/modules/themes/theme-registry";
import { cn } from "@/lib/utils/cn";

type TemplateLivePreviewProps = {
  template: TemplateSummary;
  compact?: boolean;
};

const frameTone: Record<string, string> = {
  "noir-gold": "bg-[#050505]",
  "rose-blush": "bg-[#faf6f2]"
};

export function TemplateLivePreview({ template, compact = false }: TemplateLivePreviewProps) {
  const src = `/templates/${template.code}/preview?embed=1#hero`;
  const desktopScale = compact ? 0.22 : 0.37;
  const mobileScale = compact ? 0.25 : 0.34;

  return (
    <div className={cn("relative overflow-hidden rounded-[1.1rem] border border-black/10 bg-black shadow-2xl", compact ? "h-[196px]" : "h-[340px]")}>
      <div className={cn("absolute inset-0", frameTone[template.themeCode] ?? frameTone["noir-gold"])} />

      <div className="absolute inset-y-3 left-3 right-[5.8rem] overflow-hidden rounded-xl border border-white/12 bg-black shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:right-[7.4rem]">
        <div className="flex h-7 items-center justify-between border-b border-white/10 bg-black/70 px-3">
          <div className="flex gap-1.5" dir="ltr">
            <span className="size-1.5 rounded-full bg-red-300/80" />
            <span className="size-1.5 rounded-full bg-amber-200/80" />
            <span className="size-1.5 rounded-full bg-emerald-300/80" />
          </div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.55rem] font-bold text-white/62">
            Desktop
          </span>
        </div>
        <iframe
          title={`لقطة ديسكتوب لقالب ${template.name}`}
          src={src}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute right-0 top-7 origin-top-right border-0"
          style={{
            width: 1180,
            height: 760,
            transform: `scale(${desktopScale})`
          }}
        />
      </div>

      <div className={cn("absolute bottom-3 right-3 top-3 overflow-hidden rounded-[1.3rem] border border-white/18 bg-black shadow-[0_18px_60px_rgba(0,0,0,.34)]", compact ? "w-[78px]" : "w-[116px]")}>
        <div className="mx-auto mt-1.5 h-1 w-6 rounded-full bg-white/24" />
        <iframe
          title={`لقطة موبايل لقالب ${template.name}`}
          src={src}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute left-1/2 top-4 origin-top -translate-x-1/2 border-0"
          style={{
            width: 390,
            height: 820,
            transform: `translateX(-50%) scale(${mobileScale})`
          }}
        />
      </div>
    </div>
  );
}
