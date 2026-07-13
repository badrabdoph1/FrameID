import type { TemplateSummary } from "@/modules/themes/theme-registry";
import { cn } from "@/lib/utils/cn";

type TemplateDesktopPreviewProps = {
  template: TemplateSummary;
  compact?: boolean;
};

type TemplatePreviewStyle = {
  shell: string;
  browser: string;
  accent: string;
  text: string;
  muted: string;
  imageA: string;
  imageB: string;
  card: string;
  button: string;
};

const templatePreviewStyles: Record<string, TemplatePreviewStyle> = {
  "noir-gold": {
    shell: "bg-[#050505]",
    browser: "border-white/10 bg-[#090909]",
    accent: "#e5c07b",
    text: "bg-white/82",
    muted: "bg-white/28",
    imageA: "bg-[linear-gradient(135deg,#5c4a2b,#e5c07b_48%,#16110a)]",
    imageB: "bg-[linear-gradient(135deg,#151515,#3a3327,#f8e5ba)]",
    card: "border-[#e5c07b]/25 bg-white/[0.055]",
    button: "bg-[linear-gradient(135deg,#f8e5ba,#e5c07b,#c49b50)]"
  },
  "rose-blush": {
    shell: "bg-[#faf6f2]",
    browser: "border-[#eaddd4] bg-white",
    accent: "#d48a9e",
    text: "bg-[#2c1810]/80",
    muted: "bg-[#8c7a74]/28",
    imageA: "bg-[linear-gradient(135deg,#f4d5dd,#d48a9e_48%,#8fb89a)]",
    imageB: "bg-[linear-gradient(135deg,#fff6f3,#eaddd4,#8fb89a)]",
    card: "border-[#eaddd4] bg-[#faf6f2]",
    button: "bg-[#d48a9e]"
  }
};

export function TemplateDesktopPreview({ template, compact = false }: TemplateDesktopPreviewProps) {
  const style = templatePreviewStyles[template.themeCode] ?? templatePreviewStyles["noir-gold"];

  return (
    <div className={cn("relative overflow-hidden rounded-[1.1rem] p-3 shadow-2xl", style.shell)}>
      <div className={cn("overflow-hidden rounded-xl border shadow-[0_24px_80px_rgba(0,0,0,.24)]", style.browser)}>
        <div className="flex h-7 items-center justify-between border-b border-current/10 px-3">
          <div className="flex gap-1.5" dir="ltr">
            <span className="size-1.5 rounded-full bg-red-300/80" />
            <span className="size-1.5 rounded-full bg-amber-200/80" />
            <span className="size-1.5 rounded-full bg-emerald-300/80" />
          </div>
          <div className="h-1.5 w-20 rounded-full bg-current/12" />
        </div>

          <div className={cn("grid gap-3 p-3", compact ? "min-h-[178px]" : "min-h-[236px]")}>
          <div className="flex items-center justify-between gap-3">
            <div className="h-2.5 w-20 rounded-full" style={{ background: style.accent }} />
            <div className="hidden items-center gap-2 sm:flex">
              <span className="h-1.5 w-10 rounded-full bg-current/18" />
              <span className="h-1.5 w-10 rounded-full bg-current/18" />
              <span className="h-1.5 w-10 rounded-full bg-current/18" />
            </div>
          </div>

          <div className="grid grid-cols-[1.08fr_0.92fr] gap-3">
            <div className="grid content-center gap-2">
              <span className="h-2 w-14 rounded-full" style={{ background: style.accent }} />
              <span className={cn("h-4 rounded-full", style.text)} />
              <span className={cn("h-4 w-4/5 rounded-full", style.text)} />
              <span className={cn("h-2 w-11/12 rounded-full", style.muted)} />
              <span className={cn("h-2 w-2/3 rounded-full", style.muted)} />
              <span className={cn("mt-2 h-7 w-24 rounded-full", style.button)} />
            </div>
            <div className={cn("relative min-h-24 overflow-hidden rounded-xl", style.imageA)}>
              <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-1.5">
                <span className="h-9 rounded-lg bg-white/25" />
                <span className="h-9 rounded-lg bg-black/15" />
                <span className="h-9 rounded-lg bg-white/20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className={cn("rounded-lg border p-2", style.card)}>
                <div className={cn("mb-2 h-9 rounded-md", item === 1 ? style.imageB : style.imageA)} />
                <span className={cn("block h-2 rounded-full", style.text)} />
                <span className={cn("mt-1.5 block h-1.5 w-3/4 rounded-full", style.muted)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
