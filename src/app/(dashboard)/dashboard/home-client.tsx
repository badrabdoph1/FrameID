"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { CompletionRing } from "@/components/dashboard/builder-primitives";

export function DashboardHomeClient({
  siteUrl,
  statusLabel,
  percent,
  checklist,
  lastModified,
  nextStepHref,
  nextStepLabel,
  subscription,
}: DashboardViewModel) {
  const doneCount = checklist.filter((item) => item.done).length;
  const [copied, setCopied] = useState(false);
  const activation = getActivationBanner(subscription);

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-3 pb-4 sm:gap-4">
      <section className={activationNoticeClass(activation.tone)}>
        <span className={activationGlowClass(activation.tone)} aria-hidden />
        <div className="flex min-w-0 items-center gap-2">
          <span className={activationDotClass(activation.tone)} aria-hidden />
          <p className="truncate text-xs font-black sm:text-sm">{activation.message}</p>
        </div>
        <Link href="/dashboard/billing" className={activationLinkClass(activation.tone)}>
          {activation.action}
        </Link>
      </section>

      <button
        type="button"
        onClick={copySiteUrl}
        className="grid w-full gap-2 rounded-[1.2rem] border border-white/12 bg-[#121720] p-3 text-start shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-amber-300/30 hover:bg-[#171c26] sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <span className="min-w-0">
          <span className="block text-xs font-black text-white/50">رابط موقعك — اضغط للنسخ</span>
          <span dir="ltr" className="mt-1 block truncate text-sm font-black text-[#f3cf73]">{siteUrl}</span>
        </span>
        <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-amber-300/18 bg-amber-300/10 px-3 text-xs font-black text-[#ffe49a] transition hover:bg-amber-300/16">
          {copied ? <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "اتنسخ" : "نسخ"}
        </span>
      </button>

      <section className="rounded-[1.2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(255,255,255,0.045)),#10151d] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#f3cf73]">جاهزية الموقع</p>
            <h1 className="mt-0.5 truncate text-base font-black text-[#fff7e8]">{doneCount} من {checklist.length} خطوات · {statusLabel}</h1>
            <p className="mt-1 truncate text-[0.72rem] font-bold text-white/55">آخر تعديل {lastModified}</p>
          </div>
          <div className="scale-75 rounded-full bg-black/18 p-1"><CompletionRing percent={percent} /></div>
        </div>
      </section>

      <Panel title="اكمل بيانات موقعك" description="الخطوات الأساسية في مكان واحد، من غير تكرار ولا دوشة." icon={Wand2}>
        <div className="grid gap-2">
          {checklist.map((item, index) => (
            <SetupStepRow key={item.id} item={item} index={index + 1} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={nextStepHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg shadow-amber-500/10 transition hover:-translate-y-0.5 hover:bg-[#ffe08a] hover:shadow-amber-500/20">
          {nextStepLabel}
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <Link href={siteUrl} target="_blank" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#151a24] px-4 text-sm font-black text-white/82 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b] hover:text-white">
          <ExternalLink className="size-4" aria-hidden />
          افتح الموقع كعميل
        </Link>
      </div>
    </main>
  );
}

function getActivationBanner(subscription: DashboardViewModel["subscription"]) {
  if (subscription?.hasPendingRequest) {
    return { tone: "warning" as const, message: "طلب التفعيل قيد المراجعة — تابع حالة الطلب", action: "متابعة" };
  }
  if (subscription?.isActive) {
    return { tone: "success" as const, message: "اشتراكك مفعل والموقع جاهز للتشغيل", action: "إدارة" };
  }
  if (subscription?.isTrial) {
    const days = subscription.daysRemaining !== null ? ` · متبقي ${subscription.daysRemaining} يوم` : "";
    return { tone: subscription.daysRemaining !== null && subscription.daysRemaining <= 3 ? "danger" as const : "warning" as const, message: `حسابك تجريبي برجاء التأكد من التفعيل${days}`, action: "زر التفعيل" };
  }
  return { tone: "danger" as const, message: "حسابك يحتاج مراجعة الاشتراك برجاء التفعيل", action: "تفعيل" };
}

function SetupStepRow({ item, index }: { item: DashboardViewModel["checklist"][number]; index: number }) {
  return (
    <Link
      href={item.href}
      className={item.done
        ? "group grid min-h-14 grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-2xl border border-emerald-300/16 bg-emerald-300/[0.055] px-3 py-2.5 no-underline transition hover:border-emerald-300/28 hover:bg-emerald-300/[0.09]"
        : "group grid min-h-14 grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/10 bg-[#151a24] px-3 py-2.5 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/25 hover:bg-[#1a202b]"}
    >
      <span className={item.done ? "grid size-9 place-items-center rounded-2xl bg-emerald-300/12 text-emerald-300" : "grid size-9 place-items-center rounded-2xl bg-white/[0.055] text-white/42 group-hover:text-[#f3cf73]"}>
        {item.done ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
      </span>
      <span className={item.done ? "text-[0.7rem] font-black text-emerald-200/70" : "text-[0.7rem] font-black text-[#f3cf73]/75"}>{index}</span>
      <span className="min-w-0">
        <span className={item.done ? "block truncate text-sm font-black text-[#dffbea]" : "block truncate text-sm font-black text-[#fff7e8]"}>{item.label}</span>
        <span className={item.done ? "mt-0.5 block truncate text-[0.7rem] font-bold text-emerald-100/46" : "mt-0.5 block truncate text-[0.7rem] font-bold text-white/52"}>{item.description}</span>
      </span>
      <ArrowLeft className={item.done ? "size-4 text-emerald-200/35 transition group-hover:text-emerald-200" : "size-4 text-white/30 transition group-hover:text-[#f3cf73]"} aria-hidden />
    </Link>
  );
}

function activationNoticeClass(tone: "success" | "warning" | "danger") {
  const base = "relative flex min-h-8 items-center justify-between gap-2 overflow-hidden px-1 py-1";
  if (tone === "success") {
    return `${base} text-emerald-100 drop-shadow-[0_0_10px_rgba(110,231,183,0.22)]`;
  }
  if (tone === "danger") {
    return `${base} text-red-100 drop-shadow-[0_0_10px_rgba(248,113,113,0.24)]`;
  }
  return `${base} text-amber-100 drop-shadow-[0_0_10px_rgba(243,207,115,0.24)]`;
}

function activationGlowClass(tone: "success" | "warning" | "danger") {
  if (tone === "success") {
    return "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-emerald-300/55 to-transparent shadow-[0_0_18px_rgba(110,231,183,0.5)]";
  }
  if (tone === "danger") {
    return "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-red-300/55 to-transparent shadow-[0_0_18px_rgba(248,113,113,0.5)]";
  }
  return "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-amber-300/60 to-transparent shadow-[0_0_18px_rgba(243,207,115,0.55)]";
}

function activationDotClass(tone: "success" | "warning" | "danger") {
  if (tone === "success") {
    return "size-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]";
  }
  if (tone === "danger") {
    return "size-1.5 shrink-0 rounded-full bg-red-300 shadow-[0_0_12px_rgba(248,113,113,0.8)]";
  }
  return "size-1.5 shrink-0 animate-pulse rounded-full bg-[#f3cf73] shadow-[0_0_12px_rgba(243,207,115,0.85)]";
}

function activationLinkClass(tone: "success" | "warning" | "danger") {
  if (tone === "success") {
    return "shrink-0 text-xs font-black text-emerald-200 no-underline underline-offset-4 transition hover:text-white hover:underline";
  }
  if (tone === "danger") {
    return "shrink-0 text-xs font-black text-red-200 no-underline underline-offset-4 transition hover:text-white hover:underline";
  }
  return "shrink-0 text-xs font-black text-[#f3cf73] no-underline underline-offset-4 transition hover:text-white hover:underline";
}

function Panel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-white/12 bg-[#111720] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_18px_48px_rgba(0,0,0,0.18)]">
      <header className="flex items-start gap-3 border-b border-white/10 bg-[linear-gradient(135deg,rgba(243,207,115,0.10),rgba(255,255,255,0.035))] p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-300/18 bg-amber-300/12 text-[#f3cf73] shadow-sm">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-white/58">{description}</p>
        </div>
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
