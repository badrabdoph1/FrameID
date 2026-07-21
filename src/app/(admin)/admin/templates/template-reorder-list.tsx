"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronsDown, ChevronsUp, Eye, ImageIcon, LayoutTemplate, Save } from "lucide-react";

import { reorderTemplatesAction } from "@/app/(admin)/admin/templates/reorder-templates-actions";
import { cn } from "@/lib/utils/cn";

export type TemplateOrderItem = {
  id: string;
  name: string;
  code: string;
  status: string;
  showroomOrder: number;
  previewImage?: string;
};

const inputClass = "min-h-11 w-full rounded-2xl border border-white/10 bg-black/18 px-3.5 text-sm font-extrabold text-[#fff8ea]/90 outline-none transition placeholder:text-white/25 focus:border-amber-300/55 focus:ring-4 focus:ring-amber-300/10";

function statusLabel(status: string) {
  if (status === "PUBLISHED") return "منشور";
  if (status === "ARCHIVED") return "مؤرشف";
  return "مسودة";
}

function statusTone(status: string) {
  if (status === "PUBLISHED") return "text-emerald-300";
  if (status === "ARCHIVED") return "text-white/35";
  return "text-amber-200";
}

export function TemplateReorderList({ templates }: { templates: TemplateOrderItem[] }) {
  const [items, setItems] = useState<TemplateOrderItem[]>(
    [...templates].sort((a, b) => a.showroomOrder - b.showroomOrder),
  );

  const move = (index: number, direction: "up" | "down" | "top" | "bottom") => {
    const next = [...items];
    const target =
      direction === "up"
        ? Math.max(0, index - 1)
        : direction === "down"
          ? Math.min(next.length - 1, index + 1)
          : direction === "top"
            ? 0
            : next.length - 1;
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setItems(next);
  };

  return (
    <section className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.055] p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/12 text-[#f3cf73]"><LayoutTemplate className="size-5" /></span>
        <div>
          <p className="text-xs font-black text-[#f3cf73]">ترتيب عرض القوالب</p>
          <h2 className="mt-1 text-lg font-black text-[#fff7e8]">ترتيب القوالب الجاهزة في كتالوج العملاء</h2>
          <p className="mt-1 max-w-3xl text-xs font-bold leading-6 text-white/45">استخدم أزرار التقديم والتأخير لضبط ترتيب ظهور القوالب. هذا يؤثر فقط على ترتيب الكتالوج ولا يمس مواقع العملاء المنشأة.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 grid place-items-center rounded-3xl border border-dashed border-white/12 bg-white/[0.025] px-6 py-12 text-center">
          <LayoutTemplate className="size-10 text-white/20" />
          <p className="mt-3 text-sm font-black text-white/60">لا توجد قوالب لعرضها.</p>
        </div>
      ) : (
        <form action={reorderTemplatesAction} className="mt-4 grid gap-3">
          <input type="hidden" name="order" value={JSON.stringify(items.map((t) => t.id))} />

          <ul className="grid gap-2">
            {items.map((template, index) => (
              <li
                key={template.id}
                className={cn(
                  "grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/16 p-2.5 transition",
                  index === 0 ? "border-amber-300/20" : "",
                )}
              >
                <span className="grid size-10 place-items-center rounded-xl bg-white/[0.04] text-sm font-black text-white/50">
                  {index + 1}
                </span>
                <span className="relative grid size-14 overflow-hidden rounded-xl bg-black/30">
                  {template.previewImage ? (
                    <img src={template.previewImage} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="m-auto size-5 text-white/25" />
                  )}
                </span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm font-black text-[#fff7e8]">{template.name}</strong>
                  <small className="mt-0.5 block truncate font-mono text-[0.68rem] font-bold text-white/35">{template.code}</small>
                  <small className={cn("mt-0.5 block text-[0.68rem] font-black", statusTone(template.status))}>
                    {statusLabel(template.status)}
                  </small>
                </div>
                <div className="flex items-center gap-1">
                  <IconButton
                    type="button"
                    onClick={() => move(index, "top")}
                    disabled={index === 0}
                    label="للأول"
                    title="نقل للأعلى (أول)"
                  >
                    <ChevronsUp className="size-4" />
                  </IconButton>
                  <IconButton
                    type="button"
                    onClick={() => move(index, "up")}
                    disabled={index === 0}
                    label="لأعلى"
                    title="نقل خطوة لأعلى"
                  >
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton
                    type="button"
                    onClick={() => move(index, "down")}
                    disabled={index === items.length - 1}
                    label="لأسفل"
                    title="نقل خطوة لأسفل"
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton
                    type="button"
                    onClick={() => move(index, "bottom")}
                    disabled={index === items.length - 1}
                    label="للآخر"
                    title="نقل للأسفل (آخر)"
                  >
                    <ChevronsDown className="size-4" />
                  </IconButton>
                  <a
                    href={`/templates/${template.code}/preview`}
                    target="_blank"
                    className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                    title="معاينة"
                  >
                    <Eye className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>

          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] shadow-lg transition hover:-translate-y-0.5">
            <Save className="size-4" /> حفظ ترتيب القوالب
          </button>

          <p className="text-center text-[0.7rem] font-bold text-white/35">
            يمكنك أيضًا تعديل رقم الترتيب يدويًا هنا:{" "}
            <input
              type="hidden"
              name="manual"
              value="1"
            />
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((template, index) => (
              <div key={template.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-white/8 bg-black/12 p-2">
                <span className="truncate text-xs font-black text-white/60">
                  {index + 1}. {template.name}
                </span>
                <input
                  name={`order_${template.id}`}
                  type="number"
                  defaultValue={index}
                  className={`${inputClass} w-20 min-h-9 px-2 text-center`}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value, 10);
                    if (Number.isNaN(val)) return;
                    setItems((prev) => {
                      const next = [...prev];
                      const [moved] = next.splice(index, 1);
                      const target = Math.max(0, Math.min(next.length, val));
                      next.splice(target, 0, moved);
                      return next;
                    });
                  }}
                />
              </div>
            ))}
          </div>
        </form>
      )}
    </section>
  );
}

function IconButton({
  children,
  onClick,
  disabled,
  label,
  title,
  type,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  title?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white",
        disabled ? "cursor-not-allowed opacity-25 hover:bg-white/[0.04] hover:text-white/70" : "",
      )}
    >
      {children}
    </button>
  );
}
