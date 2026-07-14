import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { PlatformPageRenderer } from "@/components/platform-pages/platform-page-renderer";
import { getContent } from "@/lib/content";
import { getTemplatePreviewImage } from "@/modules/marketing/platform-content";
import { parseHomeSectionContent } from "@/modules/platform-pages/home-page-content";
import { loadPublishedHomePageState } from "@/modules/platform-pages/home-page-runtime";
import { getPublishedTemplates } from "@/modules/themes/theme-registry";

export default async function HomePage() {
  const nav = getContent("marketing/navigation");
  const footer = getContent("marketing/footer");
  const platform = getContent("settings/platform") as {
    name: string;
    tagline: string;
    logo: string;
    supportEmail?: string;
    supportPhone?: string;
    socialLinks?: string[];
  };

  const { document } = await loadPublishedHomePageState();
  const featuredTemplate = getPublishedTemplates()[0];
  const faqSection = document.sections.find(
    (section) => section.type === "home.faq" && section.status === "visible",
  );
  const parsedFaqSection = faqSection ? parseHomeSectionContent(faqSection) : null;
  const faqItems = parsedFaqSection?.type === "home.faq"
    ? parsedFaqSection.content.items
    : [];

  const contactPoint = platform.supportEmail || platform.supportPhone
    ? {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: ["ar"],
        ...(platform.supportEmail ? { email: platform.supportEmail } : {}),
        ...(platform.supportPhone ? { telephone: platform.supportPhone } : {}),
      }
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://frameid.app/#organization",
        name: platform.name,
        url: "https://frameid.app",
        logo: "https://frameid.app/icon-512x512.svg",
        description: platform.tagline,
        ...(contactPoint ? { contactPoint } : {}),
        ...(platform.socialLinks?.length ? { sameAs: platform.socialLinks } : {}),
      },
      {
        "@type": "WebSite",
        "@id": "https://frameid.app/#website",
        name: platform.name,
        url: "https://frameid.app",
        inLanguage: "ar-EG",
        publisher: { "@id": "https://frameid.app/#organization" },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://frameid.app/#software",
        name: platform.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://frameid.app",
        inLanguage: "ar-EG",
        publisher: { "@id": "https://frameid.app/#organization" },
        description: platform.tagline,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <>
      <MarketingNav links={nav.links} />
      <PlatformPageRenderer
        definitionKey="home"
        document={document}
        featuredTemplate={featuredTemplate
          ? {
              name: featuredTemplate.name,
              description: featuredTemplate.description,
              image: getTemplatePreviewImage(featuredTemplate),
              href: `/templates/${featuredTemplate.code}/preview`,
            }
          : null}
      />
      <MarketingFooter content={footer} />
      <script
        id="frameid-home-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
