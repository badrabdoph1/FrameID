"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";

import type { DashboardViewModel } from "@/modules/dashboard/dashboard-view-model";
import { GuidanceProvider } from "@/modules/guidance";
import { analyzeSiteState, isSiteComplete, calculateProgress } from "@/modules/guidance";
import { WelcomeTour } from "@/components/dashboard/welcome-tour";
import { PersonalizedGreeting } from "@/components/dashboard/personalized-greeting";
import { SmartNextAction } from "@/components/dashboard/smart-next-action";
import { ProgressSummary } from "@/components/dashboard/progress-summary";
import { GrowthSuggestion } from "@/components/dashboard/growth-suggestion";
import { SiteIdentityCard } from "@/components/dashboard/site-identity-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { CompletedState } from "@/components/dashboard/completed-state";

type BannerTone = "success" | "warning" | "danger" | "info";

export function DashboardHomeClient({
  siteUrl,
  checklist,
  lastModified,
  subscription,
  subscriptionExperience,
  customerMessages,
  photographerName,
  isPublished,
}: DashboardViewModel) {
  const siteState = {
    hasPackages: checklist.find(c => c.id === "package")?.done ?? false,
    hasContactInfo: checklist.find(c => c.id === "contact")?.done ?? false,
    hasAvatar: checklist.find(c => c.id === "avatar")?.done ?? false,
    hasCoverImage: checklist.find(c => c.id === "cover")?.done ?? false,
    hasAlbums: checklist.find(c => c.id === "album")?.done ?? false,
    hasSeoSettings: checklist.find(c => c.id === "seo")?.done ?? false,
    isPublished,
    packagesCount: 0,
    albumsCount: 0,
    daysSinceLastUpdate: 0,
    subscriptionStatus: subscription?.status ?? null,
  };

  const { nextAction, growthSuggestion, criticalIssues } = analyzeSiteState(siteState);
  const siteComplete = isSiteComplete(siteState);
  const progress = calculateProgress(siteState);
  const showPreviewButton = siteState.hasPackages && siteState.hasContactInfo && siteState.hasCoverImage;

  return (
    <GuidanceProvider>
      <main className="customer-dashboard-home mx-auto grid w-full max-w-5xl gap-5 pb-4 sm:gap-6 lg:max-w-[1180px] lg:gap-6">
        <WelcomeTour siteUrl={siteUrl} />

        <PersonalizedGreeting
          userName={photographerName}
          siteStatus={isPublished ? "PUBLISHED" : "DRAFT"}
          lastModified={lastModified}
        />

        {criticalIssues.length > 0 ? (
          <section className="grid gap-2">
            {criticalIssues.map(issue => (
              <CriticalIssueBanner key={issue.id} issue={issue} />
            ))}
          </section>
        ) : null}

        {subscription && subscriptionExperience ? (
          <LifecycleStatusCard subscription={subscription} experience={subscriptionExperience} />
        ) : null}

        {customerMessages.length > 0 ? (
          <section className="grid gap-2 lg:grid-cols-2">
            {customerMessages.map(message => (
              <CustomerMessageBanner key={message.id} message={message} />
            ))}
          </section>
        ) : null}

        <SiteIdentityCard
          siteUrl={siteUrl}
          isPublished={isPublished}
          showPreviewButton={showPreviewButton}
        />

        {siteComplete && isPublished ? (
          <CompletedState siteUrl={siteUrl} />
        ) : (
          <>
            <SmartNextAction action={nextAction} />
            <ProgressSummary completed={progress.completed} total={progress.total} />
            <QuickActions
              nextAction={nextAction}
              siteUrl={siteUrl}
              isSiteComplete={siteComplete}
              isPublished={isPublished}
            />
          </>
        )}

        {siteComplete ? (
          <GrowthSuggestion suggestion={growthSuggestion} />
        ) : null}
      </main>
    </GuidanceProvider>
  );
}

function CriticalIssueBanner({ issue }: { issue: { id: string; title: string; description: string; href: string } }) {
  return (
    <Link
      href={issue.href}
      className="flex items-center gap-3 rounded-2xl border border-red-300/20 bg-red-500/[0.08] px-4 py-3 no-underline transition hover:border-red-300/30 hover:bg-red-500/[0.12]"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-300/15 text-red-300">
        <CalendarDays className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block text-sm font-black text-red-100">{issue.title}</strong>
        <small className="mt-0.5 block text-xs font-bold text-red-200/70">{issue.description}</small>
      </span>
    </Link>
  );
}

function LifecycleStatusCard({
  subscription,
  experience,
}: {
  subscription: NonNullable<DashboardViewModel["subscription"]>;
  experience: NonNullable<DashboardViewModel["subscriptionExperience"]>;
}) {
  if (!experience.message.enabled && !experience.timer.enabled && !experience.action.visible) {
    return null;
  }
  const endDate = subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString("ar-EG") : "دائم";
  const tone =
    experience.message.tone === "danger"
      ? "danger"
      : experience.message.tone === "warning"
        ? "warning"
        : experience.message.tone === "success"
          ? "success"
          : subscription.urgency;
  const toneClasses = tone === "danger" ? "border-red-300/20 bg-red-500/[0.06]" : tone === "warning" ? "border-amber-300/20 bg-amber-300/[0.06]" : "border-emerald-300/16 bg-emerald-300/[0.05]";
  const toneText = tone === "danger" ? "text-red-100" : tone === "warning" ? "text-amber-100" : "text-emerald-100";
  const barClass = tone === "danger" ? "bg-red-400" : tone === "warning" ? "bg-amber-400" : "bg-emerald-400";
  const buttonClass = tone === "danger" ? "bg-red-400 hover:bg-red-300 text-white" : tone === "warning" ? "bg-amber-400 hover:bg-amber-300 text-[#17120a]" : "bg-emerald-400 hover:bg-emerald-300 text-[#17120a]";
  return (
    <section className={`grid gap-3 rounded-2xl border p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:p-4 ${toneClasses}`}>
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-white/8 ${toneText}`}>
          <CalendarDays className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-xs font-black text-[#fff7e8] sm:text-sm">{experience.message.title}</span>
            <span className="text-[0.68rem] font-bold text-white/40">·</span>
            <span className="text-[0.68rem] font-bold text-white/55 sm:text-xs">{subscription.planName ?? subscription.accountType}</span>
          </div>
          <p className="mt-1 text-[0.72rem] font-bold leading-6 text-white/70 sm:text-xs">
            {experience.message.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[0.68rem] font-bold text-white/45 sm:text-xs">
              {experience.timer.enabled && experience.timer.daysRemaining !== null
                ? `متبقي ${experience.timer.daysRemaining} يوم`
                : subscription.daysRemaining === null
                  ? "اشتراك دائم"
                  : `متبقي ${subscription.daysRemaining} يوم`}
            </span>
            <span className="text-[0.68rem] font-bold text-white/30">·</span>
            <span className="text-[0.68rem] font-bold text-white/40 sm:text-xs">ينتهي: {endDate}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex flex-1 items-center gap-2 sm:flex-none">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30 sm:w-24">
            <span className={`block h-full rounded-full transition-all ${barClass}`} style={{ width: `${subscription.progressPercent ?? 100}%` }} />
          </div>
          <span className={`text-xs font-black ${toneText}`}>{subscription.progressPercent ?? 0}%</span>
        </div>
        {experience.action.visible && experience.action.href ? (
          <Link
            href={experience.action.href}
            target={experience.action.target}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-4 text-xs font-black no-underline transition sm:min-h-11 sm:px-5 sm:text-sm ${buttonClass}`}
          >
            {experience.action.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function CustomerMessageBanner({ message }: { message: DashboardViewModel["customerMessages"][number] }) {
  return (
    <section className={customerMessageClass(message.tone)}>
      <span className={activationDotClass(message.tone)} aria-hidden />
      <span className="min-w-0">
        <strong className="block truncate text-xs font-black sm:text-sm">{message.title}</strong>
        {message.body ? <small className="mt-0.5 block truncate text-[0.68rem] font-bold opacity-70">{message.body}</small> : null}
      </span>
    </section>
  );
}

function customerMessageClass(tone: BannerTone) {
  const base = "flex min-h-11 items-start gap-2 rounded-2xl border px-3 py-2";
  if (tone === "success") return `${base} border-emerald-300/18 bg-emerald-300/[0.07] text-emerald-100`;
  if (tone === "danger") return `${base} border-red-300/18 bg-red-300/[0.07] text-red-100`;
  if (tone === "info") return `${base} border-sky-300/18 bg-sky-300/[0.07] text-sky-100`;
  return `${base} border-amber-300/18 bg-amber-300/[0.07] text-amber-100`;
}

function activationDotClass(tone: BannerTone) {
  if (tone === "success") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]";
  if (tone === "danger") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-red-300 shadow-[0_0_12px_rgba(248,113,113,0.8)]";
  if (tone === "info") return "mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.75)]";
  return "mt-1.5 size-1.5 shrink-0 animate-pulse rounded-full bg-[#f3cf73] shadow-[0_0_12px_rgba(243,207,115,0.85)]";
}
