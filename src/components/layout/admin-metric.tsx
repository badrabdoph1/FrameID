"use client";

export function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "success" | "warning" | "default";
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-300"
      : tone === "warning"
      ? "border-amber-500/10 bg-amber-500/5 text-amber-300"
      : "border-white/[0.06] bg-white/[0.02] text-white";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-xs font-bold opacity-60">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}