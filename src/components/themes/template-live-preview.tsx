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
  const desktopScale = compact ? 0.28 : 0.42;

  return (
    <div className={cn("relative overflow-hidden rounded-[1.1rem] border border-black/10 bg-black shadow-2xl", compact ? "h-[196px]" : "h-[340px]")}>
      <div className={cn("absolute inset-0", frameTone[template.themeCode] ?? frameTone["noir-gold"])} />

      <div className="absolute inset-3 overflow-hidden rounded-xl border border-white/12 bg-black shadow-[0_24px_80px_rgba(0,0,0,.28)]">
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
    </div>
  );
}
