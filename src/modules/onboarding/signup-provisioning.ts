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
        subheadline: "تصوير احترافي بتجربة هادئة وراقية."
      }
    },
    {
      type: "contact",
      title: "التواصل",
      sortOrder: 10,
      data: {
        callToAction: "احجز عبر واتساب"
      }
    }
  ];
}

function createDefaultPackages(): AccountCreationInput["defaultContent"]["packages"] {
  return [
    {
      name: "Silver",
      subtitle: "سيشن خطوبة / كتب كتاب",
      priceAmount: 2500,
      currency: "EGP",
      features: ["ألبوم وسط", "عدد الصور مفتوح", "تابلوه", "الوقت مفتوح"],
      isHighlighted: false,
      sortOrder: 0
    },
    {
      name: "Mini Wedding",
      subtitle: "سيشن زفاف",
      priceAmount: 4000,
      currency: "EGP",
      features: ["تصوير الفيرست لوك", "ألبوم وسط", "تابلوه", "تصوير القاعة"],
      isHighlighted: true,
      sortOrder: 1
    },
    {
      name: "VIP Wedding",
      subtitle: "سيشن زفاف فاخر",
      priceAmount: 4500,
      currency: "EGP",
      features: ["تصوير الفيرست لوك", "ألبوم كبير", "تابلوه", "تسليم ريلز"],
      isHighlighted: false,
      sortOrder: 2
    },
    {
      name: "Full Day",
      subtitle: "تغطية يوم كامل",
      priceAmount: 7000,
      currency: "EGP",
      features: ["سيشن كاجوال", "تصوير التجهيزات", "تغطية اليوم", "تصوير القاعة"],
      isHighlighted: false,
      sortOrder: 3
    },
    {
      name: "Luxury Day",
      subtitle: "تغطية بفريق كامل",
      priceAmount: 9000,
      currency: "EGP",
      features: ["2 مصورين", "فيديو برومو", "ألبوم كبير", "تغطية كاملة"],
      isHighlighted: false,
      sortOrder: 4
    }
  ];
}

function createDefaultExtras(): AccountCreationInput["defaultContent"]["extras"] {
  return [
    { name: "فيديو برومو", priceAmount: 2500, currency: "EGP", iconKey: "video", sortOrder: 0 },
    { name: "سيشن كاجوال", priceAmount: 2500, currency: "EGP", iconKey: "camera", sortOrder: 1 },
    { name: "فيديو Reel", priceAmount: 1000, currency: "EGP", iconKey: "film", sortOrder: 2 },
    { name: "ميديا كافريدج", priceAmount: 1500, currency: "EGP", iconKey: "coverage", sortOrder: 3 },
    { name: "فوتوجرافر إضافي", priceAmount: 1000, currency: "EGP", iconKey: "team", sortOrder: 4 },
    { name: "ألبوم + تابلوه", priceAmount: 1500, currency: "EGP", iconKey: "album", sortOrder: 5 }
  ];
}
