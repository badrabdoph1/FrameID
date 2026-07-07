import { addDays } from "@/modules/shared/date";
import { hashPassword } from "@/modules/auth/password-hashing";
import { parseSignupInput } from "@/modules/auth/signup-validation";
import {
  generateSlugSuggestions,
  normalizeSlugInput,
  validateSiteSlug
} from "@/modules/sites/slug-policy";
import { getTemplateByCode } from "@/modules/themes/theme-registry";

export type ProvisionedAccountResult = {
  userId: string;
  tenantId: string;
  siteId: string;
  slug: string;
  subscriptionStatus: "TRIAL";
};

export type AccountCreationInput = {
  user: {
    name: string;
    email: string;
    passwordHash: string;
  };
  tenant: {
    displayName: string;
    status: "TRIAL";
    trialStartedAt: Date;
    trialEndsAt: Date;
  };
  site: {
    slug: string;
    title: string;
    description: string;
    themeCode: string;
    templateCode: string;
  };
  subscription: {
    status: "TRIAL";
    trialStartedAt: Date;
    trialEndsAt: Date;
  };
  defaultContent: {
    sections: Array<{
      type: string;
      title: string;
      sortOrder: number;
      data: Record<string, unknown>;
    }>;
    packages: Array<{
      name: string;
      subtitle: string;
      priceAmount: number;
      currency: string;
      features: string[];
      isHighlighted: boolean;
      sortOrder: number;
    }>;
    extras: Array<{
      name: string;
      priceAmount: number;
      currency: string;
      iconKey: string;
      sortOrder: number;
    }>;
  };
};

export type SignupProvisioningRepository = {
  emailExists(email: string): Promise<boolean>;
  getUnavailableSlugs(): Promise<ReadonlySet<string>>;
  createAccountWithSite(
    input: AccountCreationInput
  ): Promise<ProvisionedAccountResult>;
};

export type SignupProvisioningService = {
  provisionTrialSite(
    input: unknown
  ): Promise<ProvisionedAccountResult & { redirectTo: "/dashboard" }>;
};

type SignupProvisioningServiceOptions = {
  repository: SignupProvisioningRepository;
  now?: () => Date;
  trialDays?: number;
  defaultTemplateCode?: string;
};

export function createSignupProvisioningService({
  repository,
  now = () => new Date(),
  trialDays = 14,
  defaultTemplateCode = "noir-gold"
}: SignupProvisioningServiceOptions): SignupProvisioningService {
  return {
    async provisionTrialSite(rawInput) {
      const input = parseSignupInput(rawInput);
      const templateCode = input.selectedTemplateCode ?? defaultTemplateCode;
      const template = getTemplateByCode(templateCode);

      if (!template || template.status !== "published") {
        throw new Error("Selected template is not available");
      }

      if (await repository.emailExists(input.email)) {
        throw new Error("Email already exists");
      }

      const unavailableSlugs = await repository.getUnavailableSlugs();
      const slug = resolveAvailableSlug(input.name, unavailableSlugs);
      const currentTime = now();
      const trialEndsAt = addDays(currentTime, trialDays);
      const passwordHash = await hashPassword(input.password);

      const result = await repository.createAccountWithSite({
        user: {
          name: input.name,
          email: input.email,
          passwordHash
        },
        tenant: {
          displayName: input.name,
          status: "TRIAL",
          trialStartedAt: currentTime,
          trialEndsAt
        },
        site: {
          slug,
          title: input.name,
          description: "موقع مصور احترافي مبني عبر FrameID.",
          themeCode: template.themeCode,
          templateCode: template.code
        },
        subscription: {
          status: "TRIAL",
          trialStartedAt: currentTime,
          trialEndsAt
        },
        defaultContent: {
          sections: createDefaultSections(input.name),
          packages: createDefaultPackages(),
          extras: createDefaultExtras()
        }
      });

      return {
        ...result,
        redirectTo: "/dashboard"
      };
    }
  };
}

export function resolveAvailableSlug(
  displayName: string,
  unavailableSlugs: ReadonlySet<string>
): string {
  const normalizedDisplayName = normalizeSlugInput(displayName);
  const fallbackSlug = "photographer";
  const primarySlug = normalizedDisplayName || fallbackSlug;
  const suggestionBase = removeGenericStudioSuffix(primarySlug);
  const candidates = [
    ...(normalizedDisplayName ? [normalizedDisplayName] : []),
    ...generateSlugSuggestions(suggestionBase)
  ].filter((candidate, index, allCandidates) => {
    return Boolean(candidate) && allCandidates.indexOf(candidate) === index;
  });

  for (const candidate of candidates) {
    if (isUsableSlug(candidate, unavailableSlugs)) {
      return candidate;
    }
  }

  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const candidate = `${primarySlug}-${suffix}`;

    if (isUsableSlug(candidate, unavailableSlugs)) {
      return candidate;
    }
  }

  throw new Error("Unable to generate an available site slug");
}

function removeGenericStudioSuffix(slug: string): string {
  return slug.replace(/-(studio|photography|photo|gallery)$/u, "") || slug;
}

function isUsableSlug(candidate: string, unavailableSlugs: ReadonlySet<string>) {
  return validateSiteSlug(candidate).ok && !unavailableSlugs.has(candidate);
}

function createDefaultSections(
  displayName: string
): AccountCreationInput["defaultContent"]["sections"] {
  return [
    {
      type: "hero",
      title: "الرئيسية",
      sortOrder: 0,
      data: {
        photographerName: displayName,
        headline: displayName,
        subheadline: "نصنع ذكريات تبقى للأبد — تصوير حفلات الزفاف والخطوبة والجلسات الخاصة بأسلوب فاخر."
      }
    },
    {
      type: "contact",
      title: "التواصل",
      sortOrder: 10,
      data: {
        callToAction: "احجز الآن"
      }
    }
  ];
}

function createDefaultPackages(): AccountCreationInput["defaultContent"]["packages"] {
  return [
    {
      name: "الباقة البرونزية",
      subtitle: "جلسة تصوير بسيطة",
      priceAmount: 2500,
      currency: "EGP",
      features: ["3 ساعات", "جميع الصور المعدلة", "معرض إلكتروني", "تسليم خلال 7 أيام"],
      isHighlighted: false,
      sortOrder: 0
    },
    {
      name: "الباقة الفضية",
      subtitle: "نصف يوم تصوير",
      priceAmount: 5000,
      currency: "EGP",
      features: ["نصف يوم", "جميع الصور المعدلة", "ألبوم فاخر", "فيديو Highlight"],
      isHighlighted: true,
      sortOrder: 1
    },
    {
      name: "الباقة الذهبية",
      subtitle: "تغطية يوم كامل",
      priceAmount: 8500,
      currency: "EGP",
      features: ["يوم كامل", "تصوير العريس والعروسة", "فيديو سينمائي", "ألبوم فاخر", "معرض إلكتروني", "تسليم سريع"],
      isHighlighted: false,
      sortOrder: 2
    }
  ];
}

function createDefaultExtras(): AccountCreationInput["defaultContent"]["extras"] {
  return [
    { name: "فيديو سينمائي", priceAmount: 3000, currency: "EGP", iconKey: "video", sortOrder: 0 },
    { name: "Drone", priceAmount: 2500, currency: "EGP", iconKey: "camera", sortOrder: 1 },
    { name: "جلسة قبل الزفاف", priceAmount: 2000, currency: "EGP", iconKey: "camera", sortOrder: 2 },
    { name: "ألبوم فاخر", priceAmount: 1500, currency: "EGP", iconKey: "album", sortOrder: 3 },
    { name: "طباعة إضافية", priceAmount: 0, currency: "EGP", iconKey: "album", sortOrder: 4 }
  ];
}
