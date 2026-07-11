import { addDays } from "@/modules/shared/date";
import { hashPassword } from "@/modules/auth/password-hashing";
import { parseSignupInput } from "@/modules/auth/signup-validation";
import {
  generateSlugSuggestions,
  normalizeSlugInput,
  validateSiteSlug
} from "@/modules/sites/slug-policy";
import {
  createTemplateProvisioningService,
  type TemplateProvisioningRepository,
} from "@/modules/templates/template-provisioning-service";
import type { ProvisionedTemplatePayload } from "@/modules/templates/template-content-source";

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
    phone: string | null;
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
    templateVersion: string;
  };
  subscription: {
    status: "TRIAL";
    trialStartedAt: Date;
    trialEndsAt: Date;
  };
  defaultContent: ProvisionedTemplatePayload;
};

export type SignupProvisioningRepository = {
  identifierExists(input: { email: string; phone: string | null }): Promise<boolean>;
  getUnavailableSlugs(): Promise<ReadonlySet<string>>;
  isTemplateAvailable(templateCode: string): Promise<boolean>;
  createAccountWithSite(
    input: AccountCreationInput
  ): Promise<ProvisionedAccountResult>;
} & TemplateProvisioningRepository;

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
  defaultTemplateCode
}: SignupProvisioningServiceOptions): SignupProvisioningService {
  const templateProvisioning = createTemplateProvisioningService({
    repository,
    ...(defaultTemplateCode ? { defaultTemplateCode } : {}),
  });

  return {
    async provisionTrialSite(rawInput) {
      const input = parseSignupInput(rawInput);
      const templateContent = await templateProvisioning.buildSiteFromTemplate({
        templateCode: input.selectedTemplateCode,
        ownerName: input.name,
      });

      if (await repository.identifierExists({ email: input.email, phone: input.phone })) {
        throw new Error("رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل");
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
          phone: input.phone,
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
          title: templateContent.site.title,
          description: templateContent.site.description,
          themeCode: templateContent.themeCode,
          templateCode: templateContent.templateCode,
          templateVersion: templateContent.templateVersion
        },
        subscription: {
          status: "TRIAL",
          trialStartedAt: currentTime,
          trialEndsAt
        },
        defaultContent: templateContent
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
