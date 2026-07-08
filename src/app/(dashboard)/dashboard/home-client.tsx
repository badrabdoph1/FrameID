"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Circle,
  Copy,
  CreditCard,
  Eye,
  Hourglass,
  Images,
  LayoutTemplate,
  Package,
  Send,
  Share2,
  Sparkles,
  UserRound,
  Wand2,
  type LucideIcon,
} from "lucide-react";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { BuilderNotice, CompletionRing } from "@/components/dashboard/builder-primitives";

const surface = "rgba(255, 255, 255, 0.035)";
const border = "rgba(245, 234, 214, 0.09)";
const muted = "rgba(245, 234, 214, 0.58)";
const text = "#fff7e8";
const gold = "#f3cf73";

type WorkspaceCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  state: "ready" | "needs-work" | "done";
  metric: string;
};

export function DashboardHomeClient({
  photographerName,
  siteSlug,
  siteUrl,
  statusLabel,
  percent,
  checklist,
  stats,
  lastModified,
  currentTheme,
  isPublished,
  nextStepHref,
  nextStepLabel,
  nextStepTitle,
  nextStepDescription,
  subscription,
}: DashboardViewModel) {
  const doneCount = checklist.filter((item) => item.done).length;
  const nextIsExternal = nextStepHref.startsWith("/p/");
  const [copied, setCopied] = useState(false);

  const statMap = useMemo(() => new Map(stats.map((stat) => [stat.label, stat])), [stats]);
  const photos = statMap.get("الصور")?.value ?? "0";
  const albums = statMap.get("الألبومات")?.value ?? "0";
  const packages = statMap.get("الباقات")?.value ?? "0";

  const copySiteUrl = async () => {
    await navigator.clipboard?.writeText(siteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const workspaces: WorkspaceCard[] = [
    {
      title: "بياناتك وطرق التواصل",
      description: "الاسم، صورة الغلاف، واتساب، المدينة، وروابط السوشيال.",
      href: "/dashboard/site-info",
      icon: UserRound,
      state: checklist.find((item) => item.id === "contact")?.done && checklist.find((item) => item.id === "cover")?.done ? "done" : "needs-work",
      metric: checklist.find((item) => item.id === "contact")?.done ? "التواصل جاهز" : "ناقص بيانات",
    },
    {
      title: "معرض الأعمال",
      description: "ارفع أفضل صورك في ألبومات واضحة وسهلة التصفح.",
      href: "/dashboard/gallery",
      icon: Images,
      state: Number(photos) > 0 ? "done" : "needs-work",
      metric: `${photos} صورة · ${albums} ألبوم`,
    },
    {
      title: "الباقات والأسعار",
      description: "حوّل أسعارك لعروض مفهومة تساعد العميل يختار بسرعة.",
      href: "/dashboard/services",
      icon: Package,
      state: Number(packages) > 0 ? "done" : "needs-work",
      metric: `${packages} باقة`,
    },
    {
      title: "شكل الموقع",
      description: "اختار قالب مناسب لهويتك وغيّره في أي وقت.",
      href: "/dashboard/templates",
      icon: LayoutTemplate,
      state: currentTheme !== "بدون" ? "done" : "needs-work",
      metric: currentTheme,
    },
  ];

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-4 pb-4 sm:gap-5">
      <section className="grid gap-3 rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(243,207,115,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-4 shadow-2xl sm:p-5 lg:grid-cols-[1.25fr_0.75fr] lg:items-stretch">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[0.72rem] font-black text-[#f3cf73]">
              <Camera className="size-3.5" aria-hidden />
              {statusLabel}
            </span>
            <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[0.72rem] font-black text-white/45">
              آخر تعديل {lastModified}
            </span>
          </div>

          <div>
            <h1 className="text-balance text-2xl font-black leading-tight text-[#fff7e8] sm:text-3xl lg:text-4xl">
              أهلاً يا {photographerName} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-white/60 sm:text-[0.95rem]">
              دي غرفة التحكم اليومية لموقعك. من هنا تعرف الناقص، تعدّل صورك وأسعارك، وتنشر الرابط للعملاء من غير خطوات معقدة.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <Link
              href={nextStepHref}
              target={nextIsExternal ? "_blank" : undefined}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#f3cf73] to-[#d4af37] px-4 text-sm font-black text-[#17120a] no-underline shadow-lg transition hover:-translate-y-0.5 hover:shadow-amber-500/20"
            >
              {percent === 100 && isPublished ? "افتح الموقع المنشور" : nextStepLabel}
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            <Link
              href={`/p/${siteSlug}`}
              target="_blank"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline transition hover:bg-white/[0.075] hover:text-white"
            >
              <Eye className="size-4" aria-hidden />
              معاينة
            </Link>
            <button
              type="button"
              onClick={copySiteUrl}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 transition hover:bg-white/[0.075] hover:text-white"
            >
              {copied ? <CheckCircle2 className="size-4 text-emerald-300" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "اتنسخ" : "نسخ الرابط"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-white/40">جاهزية الموقع</p>
              <h2 className="mt-1 text-xl font-black text-[#fff7e8]">{doneCount} من {checklist.length} خطوات</h2>
            </div>
            <CompletionRing percent={percent} />
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
            <p className="text-sm font-black text-[#fff7e8]">{nextStepTitle}</p>
            <p className="mt-1 text-xs font-bold leading-6 text-white/55">{nextStepDescription}</p>
          </div>
        </div>
      </section>

      {subscription ? <SubscriptionCard subscription={subscription} /> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workspaces.map((workspace) => (
          <WorkspaceTile key={workspace.href} workspace={workspace} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <Panel title="خطة اليوم" description="أهم الحاجات اللي تفرق في موقعك الآن." icon={Wand2}>
          <div className="grid gap-2">
            {checklist.map((item, index) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.id === "review" ? "_blank" : undefined}
                className="group grid min-h-12 grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 no-underline transition hover:border-amber-300/20 hover:bg-amber-300/8"
              >
                <span className={item.done ? "text-emerald-300" : "text-white/25"}>
                  {item.done ? <CheckCircle2 className="size-5" aria-hidden /> : <Circle className="size-5" aria-hidden />}
                </span>
                <span className="text-[0.7rem] font-black text-white/32">{index + 1}</span>
                <span className={item.done ? "text-sm font-black text-white/45" : "text-sm font-black text-[#fff7e8]"}>{item.label}</span>
                <ArrowLeft className="size-4 text-white/25 transition group-hover:text-[#f3cf73]" aria-hidden />
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title="ملخص سريع" description="أرقام تساعدك تعرف موقعك جاهز ولا محتاج شغل." icon={Sparkles}>
          <div className="grid grid-cols-2 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/8 bg-black/15 p-3">
                <p className="text-[0.72rem] font-black text-white/40">{stat.label}</p>
                <p className={stat.tone === "success" ? "mt-1 truncate text-lg font-black text-emerald-300" : stat.tone === "warning" ? "mt-1 truncate text-lg font-black text-[#f3cf73]" : "mt-1 truncate text-lg font-black text-[#fff7e8]"}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-xs font-black text-white/40">رابط موقعك</p>
            <p className="mt-1 break-all text-xs font-bold leading-6 text-white/60">{siteUrl}</p>
          </div>
        </Panel>
      </section>

      <BuilderNotice
        tone={isPublished ? "success" : "info"}
        title={isPublished ? "موقعك منشور وجاهز للمشاركة" : "موقعك لسه مسودة"}
        description={isPublished ? "شارك الرابط مع عملائك أو ضيفه على السوشيال ميديا." : "كمل الخطوات الأساسية وبعدها انشر الموقع من صفحة النشر والمشاركة."}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Link href="/dashboard/publish" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#f3cf73] px-4 text-sm font-black text-[#17120a] no-underline">
          <Send className="size-4" aria-hidden />
          نشر ومشاركة
        </Link>
        <Link href={`/p/${siteSlug}`} target="_blank" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 no-underline">
          <Share2 className="size-4" aria-hidden />
          افتح الموقع كعميل
        </Link>
      </div>
    </main>
  );
}

function SubscriptionCard({ subscription }: { subscription: NonNullable<DashboardViewModel["subscription"]> }) {
  const state = getSubscriptionState(subscription);
  return (
    <section className="rounded-[1.35rem] border p-4" style={{ borderColor: state.border, background: state.background }}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-black/18" style={{ color: state.color }}>
            {state.icon}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-[#fff7e8]">{state.title}</h2>
              <span className="rounded-full px-2.5 py-1 text-[0.7rem] font-black" style={{ color: state.color, background: "rgba(0,0,0,0.16)" }}>{state.badge}</span>
            </div>
            <p className="mt-1 text-sm font-bold leading-6 text-white/58">{state.description}</p>
          </div>
        </div>
        <Link href={state.href} className="inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-black no-underline" style={{ background: state.color, color: "#17120a" }}>
          {state.action}
        </Link>
      </div>
    </section>
  );
}

function getSubscriptionState(subscription: NonNullable<DashboardViewModel["subscription"]>) {
  if (subscription.hasPendingRequest) {
    return {
      title: "طلب التفعيل قيد المراجعة",
      badge: "قيد المراجعة",
      description: `حالة الطلب: ${subscription.pendingRequestStatus === "SUBMITTED" ? "تم الإرسال" : subscription.pendingRequestStatus === "PENDING" ? "قيد الانتظار" : "قيد المراجعة"}. تقدر تتابع الطلب من صفحة الاشتراك.`,
      action: "متابعة الطلب",
      href: "/dashboard/billing",
      color: "#fbbf24",
      border: "rgba(251, 191, 36, 0.22)",
      background: "rgba(251, 191, 36, 0.08)",
      icon: <Hourglass className="size-5" aria-hidden />,
    };
  }
  if (subscription.isTrial) {
    const urgent = subscription.daysRemaining !== null && subscription.daysRemaining <= 3;
    return {
      title: "أنت في الفترة التجريبية",
      badge: subscription.daysRemaining !== null ? `${subscription.daysRemaining} يوم متبقي` : "تجريبي",
      description: urgent ? "التجربة قربت تخلص. فعّل اشتراكك دلوقتي عشان الموقع يفضل شغال." : "كمّل إعداد الموقع براحتك، وفعّل الاشتراك قبل نهاية التجربة.",
      action: "فعّل الاشتراك",
      href: "/dashboard/billing",
      color: urgent ? "#f87171" : "#f3cf73",
      border: urgent ? "rgba(248, 113, 113, 0.24)" : "rgba(243, 207, 115, 0.22)",
      background: urgent ? "rgba(248, 113, 113, 0.08)" : "rgba(243, 207, 115, 0.08)",
      icon: <Hourglass className="size-5" aria-hidden />,
    };
  }
  if (subscription.isActive) {
    return {
      title: subscription.planName ?? "اشتراك نشط",
      badge: "نشط",
      description: "موقعك شغال، تقدر تعدّل المحتوى أو تراجع الاشتراك في أي وقت.",
      action: "إدارة الاشتراك",
      href: "/dashboard/billing",
      color: "#4ade80",
      border: "rgba(74, 222, 128, 0.22)",
      background: "rgba(74, 222, 128, 0.07)",
      icon: <CreditCard className="size-5" aria-hidden />,
    };
  }
  return {
    title: "الاشتراك يحتاج انتباه",
    badge: subscription.status,
    description: "راجع صفحة الاشتراك لمعرفة المطلوب واستعادة كل الميزات.",
    action: "راجع الاشتراك",
    href: "/dashboard/billing",
    color: "#f87171",
    border: "rgba(248, 113, 113, 0.24)",
    background: "rgba(248, 113, 113, 0.08)",
    icon: <CreditCard className="size-5" aria-hidden />,
  };
}

function WorkspaceTile({ workspace }: { workspace: WorkspaceCard }) {
  const Icon = workspace.icon;
  const done = workspace.state === "done";
  return (
    <Link href={workspace.href} className="group grid min-h-[10.5rem] gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.035] p-4 no-underline transition hover:-translate-y-0.5 hover:border-amber-300/24 hover:bg-amber-300/8">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className={done ? "rounded-full bg-emerald-300/10 px-2.5 py-1 text-[0.68rem] font-black text-emerald-300" : "rounded-full bg-amber-300/10 px-2.5 py-1 text-[0.68rem] font-black text-[#f3cf73]"}>
          {done ? "جاهز" : "محتاج إكمال"}
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

function Panel({ title, description, icon: Icon, children }: { title: string; description: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.035]">
      <header className="flex items-start gap-3 border-b border-white/8 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-[#f3cf73]">
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
          <p className="mt-1 text-xs font-bold leading-6 text-white/45">{description}</p>
        </div>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
