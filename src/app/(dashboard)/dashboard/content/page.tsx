import { redirect } from "next/navigation";

import {
  updateContactAction,
  updateHeroAction
} from "@/app/(dashboard)/dashboard/content/actions";
import { ContentAutosaveForm } from "@/components/dashboard/content-autosave-form";
import { prisma } from "@/lib/prisma";
import { getCurrentRequestSession } from "@/modules/auth/request-session";
import { createPrismaSiteContentRepository } from "@/modules/content/prisma-site-content-repository";
import { createSiteContentService } from "@/modules/content/site-content-service";

export const dynamic = "force-dynamic";

export default async function DashboardContentPage() {
  const session = await getCurrentRequestSession();

  if (!session) {
    redirect("/login");
  }

  const content = await createSiteContentService({
    repository: createPrismaSiteContentRepository(prisma)
  }).getEditorContent({ session });

  return (
    <main className="space-y-5">
      <section>
        <h1 className="text-3xl font-semibold">محتوى الموقع</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          عدّل أهم نصوص موقعك. يتم الحفظ تلقائيًا عند الخروج من الحقل.
        </p>
      </section>

      <ContentAutosaveForm
        title="واجهة الموقع"
        description="العنوان الرئيسي والوصف الذي يظهر في أول شاشة."
        action={updateHeroAction}
        fields={[
          {
            name: "headline",
            label: "العنوان الرئيسي",
            defaultValue: content.hero.headline
          },
          {
            name: "subheadline",
            label: "الوصف المختصر",
            defaultValue: content.hero.subheadline
          },
          {
            name: "imageUrl",
            label: "رابط صورة الغلاف",
            defaultValue: content.hero.imageUrl,
            placeholder: "https://..."
          }
        ]}
      />

      <ContentAutosaveForm
        title="دعوة التواصل"
        description="النص الذي يظهر على زر الحجز في موقعك."
        action={updateContactAction}
        fields={[
          {
            name: "callToAction",
            label: "نص زر التواصل",
            defaultValue: content.contact.callToAction
          }
        ]}
      />
    </main>
  );
}
