"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Globe2,
  Lock,
  MessageCircle,
  Rocket,
} from "lucide-react";

import {
  publishSiteAction,
  unpublishSiteAction,
} from "@/app/(dashboard)/dashboard/publish/actions";
import { BuilderNotice } from "@/components/dashboard/builder-primitives";
import { DEFAULT_SUPPORT_WHATSAPP_NUMBER, toWhatsappHref } from "@/modules/support/support-utils";

type SiteFeature = {
  id: string;
  label: string;
  enabled: boolean;
  comingSoon?: boolean;
  href: string;
};

type PublishClientProps = {
  siteTitle: string;
  siteUrl: string;
  updated?: string;
  error?: string;
  isPublished: boolean;
  publishedVersion: number;
  features: SiteFeature[];
  canPublish: boolean;
  doneCount: number;
  totalCount: number;
};

export function PublishClient({
  siteUrl,
  updated,
  error,
  isPublished,
  publishedVersion,
  features,
  canPublish,
  doneCount,
  totalCount,
}: PublishClientProps) {
  const [copied, setCopied] = useState(false);
  const supportHref = toWhatsappHref(DEFAULT_SUPPORT_WHATSAPP_NUMBER, "مرحبًا، أحتاج مساعدة في تفعيل ميزة في موقعي.");

  async function copyLink() {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4">
      <section className="rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.14),transparent_36%),rgba(255,255,255,0.035)] p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[0.72rem] font-black text-[#f3cf73]">النشر والمميزات</p>
            <h1 className="mt-1 text-2xl font-black text-[#fff7e8] sm:text-3xl">مميزات موقعك</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/58">
              كل مميزات موقعك في مكان واحد. المميزات المفعلة تعمل الآن، والقريبًا قيد التطوير.
            </p>
          </div>
          <div className="grid gap-2 sm:flex">
            <button type="button" onClick={copyLink} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition hover:-translate-y-0.5">
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
              {copied ? "اتنسخ" : "نسخ الرابط"}
            </button>
            <Link href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/[0.08] hover:text-white">
              <ExternalLink className="size-4" />
              فتح الموقع
            </Link>
          </div>
        </div>
      </section>

      {updated === "published" ? <BuilderNotice tone="success" title="تم نشر الموقع" description="الرابط أصبح جاهزاً للمشاركة مع العملاء." /> : null}
      {updated === "unpublished" ? <BuilderNotice tone="info" title="تم إرجاع الموقع لمسودة" description="يمكنك تعديله ثم نشره مرة أخرى من نفس الصفحة." /> : null}
      {error === "readiness" ? <BuilderNotice tone="warning" title="لا يمكن النشر قبل اكتمال الأساسيات" description="أكمل بيانات التواصل، المعرض، الباقات، وشكل المشاركة أولاً." /> : null}
      {error && error !== "readiness" ? <BuilderNotice tone="error" title="حدث خطأ" description="راجع البيانات وجرب تاني." errorId={error} /> : null}

      <section data-smart-tip="publish-actions" className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
        <header className="flex items-start gap-3 border-b border-white/8 p-4 sm:p-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]"><Globe2 className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-[#fff7e8]">مميزات الموقع</h2>
            <p className="mt-1 text-xs font-bold leading-6 text-white/45">
              {doneCount} من {totalCount} ميزة مفعّلة
            </p>
          </div>
          <div className="shrink-0">
            {isPublished ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-3 py-1.5 text-xs font-black text-emerald-300">
                <CheckCircle2 className="size-3.5" />
                منشور · v{publishedVersion}
              </span>
            ) : canPublish ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300/15 px-3 py-1.5 text-xs font-black text-[#f3cf73]">
                <Rocket className="size-3.5" />
                جاهز للنشر
              </span>
            ) : null}
          </div>
        </header>

        <div className="grid divide-y divide-white/8">
          {features.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} />
          ))}
        </div>

        <footer className="grid gap-3 border-t border-white/8 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {isPublished ? (
              <form action={unpublishSiteAction}>
                <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-400/24 bg-red-400/10 px-4 text-sm font-black text-red-200 transition hover:bg-red-400/16">
                  إرجاع لمسودة
                </button>
              </form>
            ) : (
              <form action={publishSiteAction}>
                <button type="submit" disabled={!canPublish} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">
                  <Rocket className="size-4" />
                  نشر الموقع الآن
                </button>
              </form>
            )}
            <Link href={supportHref} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-sm font-black text-emerald-200 no-underline transition hover:bg-emerald-400/16 hover:text-white">
              <MessageCircle className="size-4" />
              التواصل مع الدعم الفني
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

function FeatureRow({ feature }: { feature: SiteFeature }) {
  const Icon = feature.comingSoon ? Lock : (feature.enabled ? CheckCircle2 : Circle);
  const iconColor = feature.comingSoon ? "text-white/25" : feature.enabled ? "text-emerald-300" : "text-white/25";

  return (
    <Link href={feature.href} className="flex items-center justify-between gap-3 px-4 py-3.5 no-underline transition hover:bg-white/[0.03] sm:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${feature.enabled ? "bg-emerald-300/10" : "bg-white/[0.04]"} ${iconColor}`}>
          <Icon className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-[#fff7e8]">{feature.label}</span>
          {feature.comingSoon ? (
            <span className="mt-0.5 block text-[0.68rem] font-bold text-white/35">قريبًا</span>
          ) : null}
        </span>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-black ${feature.enabled ? "bg-emerald-300/10 text-emerald-300" : feature.comingSoon ? "bg-white/[0.06] text-white/35" : "bg-white/[0.06] text-white/35"}`}>
        {feature.enabled ? "مفعّل" : feature.comingSoon ? "قريبًا" : "غير مفعّل"}
      </span>
    </Link>
  );
}
