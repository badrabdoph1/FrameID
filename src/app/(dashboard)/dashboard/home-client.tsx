"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  Images,
  Package,
  Rocket,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { CompletionRing } from "@/components/dashboard/builder-primitives";

type WorkspaceCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  state: "ready" | "needs-work" | "done";
  metric: string;
};

export function DashboardHomeClient({
  siteUrl,
  statusLabel,
  percent,
  checklist,
  phases,
  operatingAlerts,
  stats,
  lastModified,
  isPublished,
  isReadyToPublish,
  nextStepHref,
  nextStepLabel,
  nextStepTitle,
  nextStepDescription,
  subscription,
}: DashboardViewModel) {
  const doneCount = checklist.filter((item) => item.done).length;
  const [copied, setCopied] = useState(false);
  const statMap = useMemo(() => new Map(stats.map((stat) => [stat.label, stat])), [stats]);

  const packages = statMap.get("الباقات")?.value ?? "0";
  const contact = statMap.get("التواصل")?.value ?? "ناقص";
  const photos = statMap.get("الصور")?.value ?? "0";
  const publishState = statMap.get("النشر")?.value ?? statusLabel;

  const activation = getActivationBanner(subscription);

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const workspaces: WorkspaceCard[] = [
    {
      title: "الباقات",
      description: "أول خطوة: اكتب أسعارك وباقاتك بنفسك.",
      href: "/dashboard/services",
      icon: Package,
      state: Number(packages) > 0 ? "done" : "needs-work",
      metric: `${packages} باقة`,
    },
    {
      title: "بيانات التواصل",
      description: "اسم المصور، واتساب، وفيسبوك/إنستجرام/تيك توك.",
      href: "/dashboard/site-info",
      icon: UserRound,
      state: contact === "جاهز" ? "done" : "needs-work",
      metric: contact,
    },
    {
      title: "الصور",
      description: "الصورة الشخصية، الغلاف، وألبومات أعمالك.",
      href: "/dashboard/gallery",
      icon: Images,
      state: Number(photos) > 0 ? "done" : "needs-work",
      metric: `${photos} صورة`,
    },
    {
      title: "النشر",
      description: "راجع الرابط وشكل المشاركة ثم انشر الموقع.",
      href: "/dashboard/publish",
      icon: Rocket,
      state: isPublished ? "done" : isReadyToPublish ? "ready" : "needs-work",
      metric: publishState,
    },
  ];

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-3 pb-4 sm:gap-4">
      <section className={activation.tone === "danger" ? "grid gap-2 rounded-2xl border border-red-400/24 bg-red-400/10 p-3 text-red-100" : "grid gap-2 rounded-2xl border border-amber-300/24 bg-amber-300/10 p-3 text-amber-100 sm:grid-cols-[1fr_auto] sm:items-center"}>
        <div className="flex min-w-0 items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          <p className="truncate text-sm font-black">{activation.message}</p>
        </div>
        <Link href="/dashboard/billing" className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#f3cf73] px-3 text-xs font-black text-[#17120a] no-underline">
          {activation.action}
        </Link>
      </section>

      <button
        type="button"
        onClick={copySiteUrl}
        className="grid w-full gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3 text-start transition hover:border-amber-300/20 hover:bg-amber-300/8 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <span className="min-w-0">
          <span className="block text-xs font-black text-white/38">رابط موقعك — اضغط للنسخ</span>
          <span dir="ltr" className="mt-1 block truncate text-sm font-black text-[#f3cf73]">{siteUrl}</span>
        </span>
        <span className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 text-xs font-black text-white/72">
          {copied ? <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "اتنسخ" : "نسخ"}
        </span>
      </button>

      <section className="grid gap-2 rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.12),transparent_40%),rgba(255,255,255,0.035)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-white/40">جاهزية الموقع</p>
            <h1 className="mt-0.5 truncate text-base font-black text-[#fff7e8]">{doneCount} من {checklist.length} خطوات · {statusLabel}</h1>
            <p className="mt-1 truncate text-[0.72rem] font-bold text-white/42">آخر تعديل {lastModified}</p>
          </div>
          <div className="scale-75"><CompletionRing percent={percent} /></div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-black/18 px-3 py-2">
          <p className="truncate text-sm font-black text-[#fff7e8]">{nextStepTitle}</p>
          <p className="mt-0.5 line-clamp-2 text-xs font-bold leading-5 text-white/50">{nextStepDescription}</p>
        </div>
      </section>

      <Panel title="خطة اليوم" description="امشي بالترتيب من غير ما تدور في الصفحات." icon={Wand2}>
        <div className="grid gap-2">
          {checklist.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className="group grid min-h-12 grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8"
            >
              <span className={item.done ? "text-emerald-300" : "text-white/25"}>
                {item.done ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
              </span>
              <span className="text-[0.7rem] font-black text-white/32">{index + 1}</span>
              <span className="min-w-0">
                <span className={item.done ? "block truncate text-sm font-black text-white/45" : "block truncate text-sm font-black text-[#fff7e8]"}>{item.label}</span>
                <span className="mt-0.5 block truncate text-[0.68rem] font-bold text-white/32">{item.description}</span>
              </span>
              <ArrowLeft className="size-4 text-white/25 transition group-hover:text-[#f3cf73]" aria-hidden />
            </Link>
          ))}
        </div>
      </Panel>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workspaces.map((workspace) => (
          <WorkspaceTile key={workspace.href} workspace={workspace} />
        ))}
      </section>

      <Panel title="المراحل" description="ترتيب مبسط يناسب الموبايل والشخص العادي." icon={ArrowLeft}>
        <div className="grid gap-2">
          {phases.map((phase, index) => (
            <PhaseRow key={phase.id} phase={phase} index={index + 1} />
          ))}
        </div>
      </Panel>

      {operatingAlerts.length > 0 ? (
        <div className="grid gap-2">
          {operatingAlerts.map((alert) => (
            <Link key={`${alert.title}-${alert.href}`} href={alert.href} className={`rounded-2xl border p-3 no-underline ${alertToneClass(alert.tone)}`}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-black">{alert.title}</strong>
                <span className="text-xs font-black">{alert.actionLabel}</span>
              </div>
              <p className="mt-1 text-xs font-bold leading-5 opacity-75">{alert.description}</p>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href={nextStepHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline">
          {nextStepLabel}
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
        <Link href={siteUrl} target="_blank" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline">
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

function PhaseRow({ phase, index }: { phase: DashboardViewModel["phases"][number]; index: number }) {
  const isDone = phase.state === "done";
  const isActive = phase.state === "active";
  return (
    <Link href={phase.href} className="grid gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span className={isDone ? "grid size-9 place-items-center rounded-2xl bg-emerald-300/10 text-emerald-300" : isActive ? "grid size-9 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]" : "grid size-9 place-items-center rounded-2xl bg-white/[0.04] text-white/28"}>
        {isDone ? <CheckCircle2 className="size-4" aria-hidden /> : <span className="text-xs font-black">{index}</span>}
      </span>
      <span className="min-w-0">
        <strong className={phase.state === "locked" ? "block truncate text-sm font-black text-white/36" : "block truncate text-sm font-black text-[#fff7e8]"}>{phase.title}</strong>
        <span className="mt-0.5 block truncate text-xs font-bold text-white/38">{phase.description}</span>
      </span>
      <span className="text-xs font-black text-white/35">{phase.done}/{phase.total}</span>
    </Link>
  );
}

function WorkspaceTile({ workspace }: { workspace: WorkspaceCard }) {
  const Icon = workspace.icon;
  const done = workspace.state === "done";
  const ready = workspace.state === "ready";
  return (
    <Link href={workspace.href} className="group grid min-h-[9rem] gap-3 rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-3 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/8">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className={done ? "rounded-full bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : ready ? "rounded-full bg-sky-300/10 px-2.5 py-1 text-[0.68rem] font-black text-sky-200" : "rounded-full bg-amber-300/10 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]"}>
          {done ? "جاهز" : ready ? "جاهز" : "اكمل"}
        </span>
      </div>
      <div>
        <h3 className="text-base font-black text-[#fff7e8]">{workspace.title}</h3>
        <p className="mt-1 text-xs font-bold leading-6 text-white/52">{workspace.description}</p>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-xs font-black text-white/38">
        <span className="truncate">{workspace.metric}</span>
        <ArrowLeft className="size-4 transition group-hover:text-[#f3cf73]" aria-hidden />
      </div>
    </Link>
  );
}

function alertToneClass(tone: DashboardViewModel["operatingAlerts"][number]["tone"]): string {
  if (tone === "success") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (tone === "danger") return "border-red-400/24 bg-red-400/10 text-red-200";
  if (tone === "warning") return "border-amber-300/24 bg-amber-300/10 text-amber-100";
  return "border-sky-300/20 bg-sky-300/10 text-sky-100";
}

function Panel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.035]">
      <header className="flex items-start gap-3 border-b border-white/8 p-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-5 text-white/45">{description}</p>
        </div>
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
