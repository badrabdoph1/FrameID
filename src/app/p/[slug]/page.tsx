import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getPlatformBaseUrl } from "@/lib/platform-url";
import { createPrismaPublicSiteRepository } from "@/modules/public-sites/prisma-public-site-repository";
import { createPublicSiteViewModel } from "@/modules/public-sites/public-site-view-model";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getPublicSite(slug: string) {
  const repository = createPrismaPublicSiteRepository(prisma);
  const site = await repository.findBySlug(slug);

  if (!site || site.status !== "PUBLISHED") {
    return null;
  }

  return createPublicSiteViewModel({
    site,
    platformBaseUrl: getPlatformBaseUrl()
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) {
    return {
      title: "الموقع غير موجود"
    };
  }

  return site.metadata;
}

export default async function PublicSitePage({ params }: Props) {
  const { slug } = await params;
  const site = await getPublicSite(slug);

  if (!site) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(site.structuredData)
        }}
      />
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src={site.hero.imageUrl}
          alt={site.hero.headline}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,7,7,.35),rgba(7,7,7,.9))]" />
        <div className="container-page relative flex min-h-screen flex-col justify-end pb-20">
          <p className="font-display text-sm uppercase tracking-[0.28em] text-champagne">
            Professional Photography
          </p>
          <h1 className="mt-4 text-5xl font-semibold md:text-8xl">
            {site.hero.headline}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">
            {site.hero.subheadline}
          </p>
          <a
            href="#contact"
            className="mt-8 inline-flex w-fit min-h-11 items-center rounded-[var(--radius-control)] bg-white px-5 text-sm font-semibold text-ink"
          >
            {site.contact.callToAction}
          </a>
        </div>
      </section>

      {site.gallery.length ? (
        <section className="container-page py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-sm uppercase tracking-[0.24em] text-champagne">
                Portfolio
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                أعمال مختارة
              </h2>
            </div>
            <span className="text-sm text-white/50">{site.gallery.length} صورة</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {site.gallery.map((image, index) => (
              <figure
                key={image.id}
                className={index === 0 ? "sm:col-span-2 sm:row-span-2" : undefined}
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)] bg-white/5">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                    className="object-cover"
                  />
                </div>
                {image.caption ? (
                  <figcaption className="mt-2 text-sm text-white/55">
                    {image.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {site.packages.length ? (
        <section className="border-y border-white/10 bg-white/[0.03] py-20">
          <div className="container-page">
            <p className="font-display text-sm uppercase tracking-[0.24em] text-champagne">
              Packages
            </p>
            <h2 className="mt-3 text-3xl font-semibold md:text-5xl">الباقات</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {site.packages.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.06] p-5"
                >
                  {item.isHighlighted ? (
                    <span className="inline-flex min-h-7 items-center rounded-full bg-champagne px-3 text-xs font-semibold text-ink">
                      الأكثر طلبًا
                    </span>
                  ) : null}
                  <h3 className="mt-4 text-xl font-semibold">{item.name}</h3>
                  {item.subtitle ? (
                    <p className="mt-2 text-sm text-white/60">{item.subtitle}</p>
                  ) : null}
                  <p className="mt-5 text-2xl font-semibold text-champagne">
                    {item.price}
                  </p>
                  {item.features.length ? (
                    <ul className="mt-5 space-y-2 text-sm text-white/68">
                      {item.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {site.extras.length ? (
        <section className="container-page py-20">
          <p className="font-display text-sm uppercase tracking-[0.24em] text-champagne">
            Extras
          </p>
          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            خدمات إضافية
          </h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {site.extras.map((item) => (
              <article
                key={item.id}
                className="rounded-[var(--radius-card)] border border-white/10 p-4"
              >
                <h3 className="font-semibold">{item.name}</h3>
                <p className="mt-2 text-sm text-champagne">{item.price}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="contact" className="container-page py-20 text-center">
        <p className="font-display text-sm uppercase tracking-[0.24em] text-champagne">
          Booking
        </p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold md:text-5xl">
          جاهز لتوثيق قصتك؟
        </h2>
        <a
          href={`mailto:?subject=${encodeURIComponent(site.hero.headline)}`}
          className="mt-8 inline-flex min-h-12 items-center rounded-[var(--radius-control)] bg-white px-6 text-sm font-semibold text-ink"
        >
          {site.contact.callToAction}
        </a>
      </section>
    </main>
  );
}
