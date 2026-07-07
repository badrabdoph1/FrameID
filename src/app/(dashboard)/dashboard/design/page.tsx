import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { selectTemplateAction } from "@/app/(dashboard)/dashboard/design/actions";
import { DashboardTemplateSelectionCard } from "@/components/dashboard/dashboard-template-selection-card";
import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";
import { Badge } from "@/components/ui/badge";

type DashboardDesignPageProps = {
  searchParams: Promise<{
    selected?: string;
    error?: string;
  }>;
};

export const metadata: Metadata = {
  title: "التصميم والقوالب | FrameID"
};

export const dynamic = "force-dynamic";

export default async function DashboardDesignPage({
  searchParams
}: DashboardDesignPageProps) {
  const session = await getCurrentRequestSession();
  const { selected, error } = await searchParams;

  if (!session) {
    redirect("/login");
  }

  const templates = getPublishedTemplates();
  const currentSite = await prisma.site.findUnique({
    where: {
      id: session.site.id
    },
    select: {
      theme: {
        select: {
          code: true,
          name: true
        }
      }
    }
  });
  const currentThemeCode = currentSite?.theme.code;

  return (
    <main className="space-y-6">
      <section className="rounded-[var(--radius-panel)] border border-border bg-[linear-gradient(135deg,var(--color-surface),var(--color-muted))] p-5 sm:p-7">
        <Badge tone="luxury">محرك التصميم</Badge>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
          اختر الإحساس البصري لموقعك.
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          القالب يغير طريقة عرض الصور والباقات والحجز، بينما تظل بياناتك محفوظة كما هي.
        </p>
        <div className="mt-5 rounded-2xl border border-border/80 bg-background/70 p-4">
          <p className="text-xs text-muted-foreground">القالب المفعل الآن</p>
          <p className="mt-1 text-lg font-semibold">
            {currentSite?.theme.name ?? "لم يتم تحديد قالب"}
          </p>
        </div>
      </section>

      {selected ? (
        <p className="rounded-[var(--radius-panel)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          تم تفعيل القالب على موقعك.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-[var(--radius-panel)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          تعذر تفعيل القالب. اختر قالبًا متاحًا وحاول مرة أخرى.
        </p>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">القوالب المتاحة</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            عاين القالب على بيانات تجريبية قبل تفعيله.
          </p>
        </div>
        {templates.map((template) => (
          <DashboardTemplateSelectionCard
            key={template.code}
            template={template}
            isCurrent={template.themeCode === currentThemeCode}
            action={selectTemplateAction}
          />
        ))}
      </section>
    </main>
  );
}
