"use client";

import { useState } from "react";

interface DependencyNode {
  id: string;
  label: string;
  group: string;
  dependsOn: string[];
  dependedBy: string[];
}

interface DependencyExplorerProps {
  nodes: DependencyNode[];
}

const GROUP_ORDER = ["المنصة", "العملاء", "المالية", "المحتوى"];

const GROUP_TONES: Record<string, string> = {
  "المنصة": "border-sky-300/30 bg-sky-300/10 text-sky-300",
  "العملاء": "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  "المالية": "border-[#f3cf73]/30 bg-[#f3cf73]/10 text-[#f3cf73]",
  "المحتوى": "border-purple-400/30 bg-purple-400/10 text-purple-400",
};

export function DependencyExplorer({ nodes }: DependencyExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const labelMap = new Map(nodes.map((n) => [n.id, n.label]));
  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    nodes: nodes.filter((n) => n.group === g),
  })).filter((g) => g.nodes.length > 0);

  const selected = selectedId ? nodes.find((n) => n.id === selectedId) : null;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="text-base font-black text-[#fff7e8]">خريطة التبعيات</h2>
        <p className="mt-1 text-xs font-bold text-white/40">
          عرض الوحدات وعلاقات الاعتماد بينها
        </p>
      </div>

      <div className="space-y-5">
        {grouped.map(({ group, nodes: groupNodes }) => (
          <div key={group}>
            <h3 className="mb-2 text-xs font-black text-white/50">{group}</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {groupNodes.map((node) => {
                const isSelected = node.id === selectedId;
                const tone = GROUP_TONES[node.group] ?? "border-white/10 bg-white/5 text-white/60";
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedId(isSelected ? null : node.id)}
                    className={`rounded-xl border px-3 py-2.5 text-right transition ${
                      isSelected
                        ? "border-[#f3cf73]/50 bg-[#f3cf73]/5"
                        : "border-white/[0.06] bg-black/20 hover:border-white/[0.12]"
                    }`}
                  >
                    <p className="text-xs font-black text-white/80">{node.label}</p>
                    <span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${tone}`}>
                      {node.group}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          <p className="mb-3 text-sm font-black text-[#f3cf73]">{selected.label}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-black text-white/50">يعتمد على:</p>
              {selected.dependsOn.length === 0 ? (
                <p className="text-[11px] font-bold text-white/30">لا يوجد</p>
              ) : (
                <ul className="space-y-1">
                  {selected.dependsOn.map((id) => (
                    <li key={id} className="text-xs font-bold text-white/60">
                      {labelMap.get(id) ?? id}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-black text-white/50">يعتمد عليه:</p>
              {selected.dependedBy.length === 0 ? (
                <p className="text-[11px] font-bold text-white/30">لا يوجد</p>
              ) : (
                <ul className="space-y-1">
                  {selected.dependedBy.map((id) => (
                    <li key={id} className="text-xs font-bold text-white/60">
                      {labelMap.get(id) ?? id}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
