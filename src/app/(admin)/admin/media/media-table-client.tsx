"use client";

import { useRef, useState } from "react";
import { ExternalLink, ImageIcon, RefreshCw, Replace, Search } from "lucide-react";
import Image from "next/image";

import { replaceMediaAction } from "./actions";

type MediaRow = {
  id: string;
  url: string;
  storageKey: string;
  fileName: string;
  path: string;
  alt: string | null;
  mimeType: string;
  sizeBytes: number;
  sizeLabel: string;
  dimensions: string | null;
  kind: string;
  tenantName: string;
  usages: string;
  createdAt: string;
};

export function MediaTableClient({ rows }: { rows: MediaRow[] }) {
  const [search, setSearch] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filtered = search
    ? rows.filter(
        (r) =>
          r.fileName.toLowerCase().includes(search.toLowerCase()) ||
          r.tenantName.toLowerCase().includes(search.toLowerCase()) ||
          r.usages.toLowerCase().includes(search.toLowerCase()),
      )
    : rows;

  const handleReplace = async (id: string) => {
    const input = fileRefs.current[id];
    if (!input || !input.files?.[0]) return;
    setReplacingId(id);
    setMessage(null);

    const fd = new FormData();
    fd.set("assetId", id);
    fd.set("file", input.files[0]);

    try {
      await replaceMediaAction(fd);
      setMessage({ type: "success", text: "تم استبدال الصورة بنجاح" });
      input.value = "";
    } catch {
      setMessage({ type: "error", text: "فشل استبدال الصورة" });
    }
    setReplacingId(null);
  };

  return (
    <div className="grid gap-3">
      {message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-black ${
            message.type === "success"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <label className="relative">
        <span className="sr-only">ابحث في الوسائط</span>
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم الملف أو العميل أو الاستخدام..."
          className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-10 pl-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-amber-300/45 focus:ring-4 focus:ring-amber-300/10"
        />
      </label>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-right text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-3 py-3 text-xs font-black text-white/45">
                الصورة
              </th>
              <th className="px-3 py-3 text-xs font-black text-white/45">
                اسم الملف
              </th>
              <th className="hidden px-3 py-3 text-xs font-black text-white/45 md:table-cell">
                المسار
              </th>
              <th className="hidden px-3 py-3 text-xs font-black text-white/45 sm:table-cell">
                الحجم
              </th>
              <th className="hidden px-3 py-3 text-xs font-black text-white/45 lg:table-cell">
                الاستخدام
              </th>
              <th className="px-3 py-3 text-xs font-black text-white/45">
                استبدال
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/6 transition hover:bg-white/[0.02]"
              >
                <td className="px-3 py-2.5">
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative block aspect-square size-12 overflow-hidden rounded-lg bg-black/30"
                  >
                    {row.mimeType.startsWith("image/") ? (
                      <Image
                        src={row.url}
                        alt={row.alt ?? ""}
                        fill
                        unoptimized
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid size-full place-items-center">
                        <ImageIcon className="size-5 text-white/20" />
                      </span>
                    )}
                  </a>
                </td>
                <td className="min-w-0 max-w-[200px] px-3 py-2.5">
                  <p
                    className="truncate font-bold text-[#fff7e8]"
                    title={row.fileName}
                  >
                    {row.alt || row.fileName}
                  </p>
                  <p className="truncate text-[0.65rem] font-bold text-white/35">
                    {row.tenantName}
                    {row.dimensions ? ` · ${row.dimensions}` : ""}
                  </p>
                </td>
                <td className="hidden max-w-[200px] px-3 py-2.5 md:table-cell">
                  <code
                    className="block truncate text-[0.65rem] font-bold text-white/35"
                    dir="ltr"
                    title={row.path}
                  >
                    {row.path}
                  </code>
                  <div className="mt-0.5 flex gap-1">
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[0.6rem] font-bold text-white/40 transition hover:text-white/70"
                    >
                      <ExternalLink className="size-2.5" />
                      فتح
                    </a>
                  </div>
                </td>
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <span className="text-xs font-bold text-white/50">
                    {row.sizeLabel}
                  </span>
                </td>
                <td className="hidden max-w-[200px] px-3 py-2.5 lg:table-cell">
                  <span
                    className="block truncate text-[0.68rem] font-bold text-white/42"
                    title={row.usages}
                  >
                    {row.usages}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <label
                    className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition ${
                      replacingId === row.id
                        ? "border-amber-300/30 bg-amber-300/10 text-amber-300 opacity-50"
                        : "border-white/10 bg-white/[0.04] text-white/55 hover:border-amber-300/25 hover:bg-amber-300/8 hover:text-[#f3cf73]"
                    }`}
                  >
                    {replacingId === row.id ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        جاري...
                      </>
                    ) : (
                      <>
                        <Replace className="size-3.5" />
                        استبدال
                      </>
                    )}
                    <input
                      ref={(el) => {
                        fileRefs.current[row.id] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={() => handleReplace(row.id)}
                    />
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs font-bold text-white/30">
        {filtered.length.toLocaleString("ar-EG")} من{" "}
        {rows.length.toLocaleString("ar-EG")} ملف
      </p>
    </div>
  );
}
