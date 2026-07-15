import { Sparkles } from "lucide-react";

import { AdminPageShell } from "@/components/layout/admin-page-shell";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/modules/admin/admin-permission-guards";
import { allCards, welcomeCardDefs, guideCardDefs, type OnboardingCardDef } from "@/lib/onboarding-cards";
import { saveCardOverride, resetCardOverride } from "@/app/(admin)/admin/onboarding-cards/actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ saved?: string; error?: string; reset?: string }>;
};

function getTypeLabel(type: OnboardingCardDef["type"]): string {
  return type === "welcome" ? "كارت ترحيبي" : "كارت توجيهي";
}

export default async function AdminOnboardingCardsPage({ searchParams }: Props) {
  await requireAdminPermission("onboarding-cards", "view");
  const params = await searchParams;

  const flagKeys = allCards.map((card) => `onboarding-card:${card.id}`);
  const flags = await prisma.featureFlag.findMany({
    where: {
      key: { in: flagKeys },
      scope: "PLATFORM",
      tenantId: null,
      siteId: null,
      enabled: true,
    },
    select: { key: true, value: true },
  });

  const overrides = new Map<string, { title: string; description: string }>();
  for (const flag of flags) {
    const cardId = flag.key.replace("onboarding-card:", "");
    const value = flag.value as { title?: string; description?: string } | null;
    if (value?.title && value?.description) {
      overrides.set(cardId, { title: value.title, description: value.description });
    }
  }

  const totalOverrides = overrides.size;
  const totalCards = allCards.length;

  return (
    <AdminPageShell
      badge="المحتوى"
      title="الكروت الترحيبية والمساعدة"
      description={`${totalOverrides} من ${totalCards} كارت تم تخصيصه. كل كارت يظهر للعميل في صفحة محددة داخل لوحة التحكم.`}
      breadcrumbs={[
        { label: "القيادة", href: "/admin" },
        { label: "الكروت الترحيبية والمساعدة" },
      ]}
    >
      <div className="grid gap-8">
        {params.saved ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-200">
            تم حفظ التعديلات بنجاح.
          </div>
        ) : null}
        {params.error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {params.error}
          </div>
        ) : null}
        {params.reset ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200">
            تمت استعادة النص الافتراضي.
          </div>
        ) : null}

        <CardGroup
          title="رحلة الترحيب (٥ كروت)"
          description="الكروت اللي بتظهر بعد تسجيل الدخول أو إنشاء الحساب مباشرة."
          cards={welcomeCardDefs}
          overrides={overrides}
          saveAction={saveCardOverride}
          resetAction={resetCardOverride}
        />

        <CardGroup
          title="كروت التوجيه داخل الأقسام (٧ كروت)"
          description="الكروت اللي بتظهر في كل قسم من أقسام لوحة التحكم لمساعدة العميل."
          cards={guideCardDefs}
          overrides={overrides}
          saveAction={saveCardOverride}
          resetAction={resetCardOverride}
        />
      </div>
    </AdminPageShell>
  );
}

function CardGroup({
  title,
  description,
  cards,
  overrides,
  saveAction,
  resetAction,
}: {
  title: string;
  description: string;
  cards: OnboardingCardDef[];
  overrides: Map<string, { title: string; description: string }>;
  saveAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  resetAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-base font-black text-[#fff7e8]">{title}</h2>
        <p className="mt-0.5 text-xs font-bold text-white/45">{description}</p>
      </div>
      <div className="grid gap-3">
        {cards.map((card) => {
          const override = overrides.get(card.id);
          const isOverridden = Boolean(override);
          const displayTitle = override?.title ?? card.title;
          const displayDesc = override?.description ?? card.description;

          return (
            <article
              key={card.id}
              className={`rounded-2xl border p-4 sm:p-5 ${
                isOverridden
                  ? "border-amber-500/20 bg-amber-500/[0.06]"
                  : "border-white/10 bg-white/[0.025]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-white/40">
                    {card.type === "welcome" ? (
                      <span className="text-xs font-black">{card.order}</span>
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-black text-[#fff7e8]">
                        {card.label}
                      </strong>
                      <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-px text-[0.6rem] font-bold text-white/40">
                        {getTypeLabel(card.type)}
                      </span>
                      {isOverridden ? (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-px text-[0.6rem] font-bold text-amber-300">
                          مخصص
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[0.6rem] font-bold text-white/35">
                      {card.routeLabel} ← {card.route}
                    </p>
                  </div>
                </div>
              </div>

              <CardEditForm
                cardId={card.id}
                title={displayTitle}
                description={displayDesc}
                isOverridden={isOverridden}
                saveAction={saveAction}
                resetAction={resetAction}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CardEditForm({
  cardId,
  title,
  description,
  isOverridden,
  saveAction,
  resetAction,
}: {
  cardId: string;
  title: string;
  description: string;
  isOverridden: boolean;
  saveAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
  resetAction: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  return (
    <form action={saveAction} className="mt-3 grid gap-2">
      <input type="hidden" name="cardId" value={cardId} />
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-[0.62rem] font-bold text-white/40">العنوان</span>
          <input
            name="title"
            defaultValue={title}
            maxLength={200}
            required
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-[#fff7e8] placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.62rem] font-bold text-white/40">الوصف</span>
          <input
            name="description"
            defaultValue={description}
            maxLength={500}
            required
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-bold text-[#fff7e8] placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
          />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#f3cf73] px-4 text-xs font-black text-[#17120a] transition hover:-translate-y-px hover:bg-[#ffe08a]"
        >
          حفظ
        </button>
        {isOverridden ? (
          <button
            type="submit"
            formAction={resetAction}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/8 px-3 text-xs font-bold text-red-200 transition hover:bg-red-400/14"
          >
            استعادة الافتراضي
          </button>
        ) : null}
      </div>
    </form>
  );
}
