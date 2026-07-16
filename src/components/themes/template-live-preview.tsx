import type { TemplateSummary } from "@/modules/themes/theme-registry";
import { cn } from "@/lib/utils/cn";

type TemplateLivePreviewProps = {
  template: TemplateSummary;
  compact?: boolean;
};

const frameTone: Record<string, string> = {
  "noir-gold": "bg-[#080808]",
  "rose-blush": "bg-[#faf6f2]"
};

export function TemplateLivePreview({ template, compact = false }: TemplateLivePreviewProps) {
  const src = `/templates/${template.code}/preview?embed=1#hero`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        compact ? "h-[160px]" : "h-[240px] md:h-[300px]"
      )}
    >
      <div className={cn("absolute inset-0", frameTone[template.themeCode] ?? frameTone["noir-gold"])} />

      <div className="absolute inset-0 overflow-hidden">
        <iframe
          title={`معاينة قالب ${template.name}`}
          src={src}
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          className={cn(
            "pointer-events-none absolute right-0 top-0 origin-top-right border-0 transition-transform duration-700",
            compact
              ? "scale-[0.26] md:scale-[0.30]"
              : "scale-[0.33] md:scale-[0.42]"
          )}
          style={{
            width: 1180,
            height: 760,
            touchAction: "none",
            overflow: "hidden"
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent" />
    </div>
  );
}
