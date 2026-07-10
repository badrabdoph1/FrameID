import { normalizePhoneIdentifier } from "@/modules/auth/auth-identifier";
import { hashPassword } from "@/modules/auth/password-hashing";

export type SuperAdminSeedRepository = {
  upsertSuperAdmin(input: {
    email: string;
    phone: string | null;
    name: string;
    passwordHash: string;
  }): Promise<void>;
};

function cleanOptionalEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  return trimmed.replace(/^['"]|['"]$/g, "").trim() || undefined;
}

function normalizeOptionalPhone(phone: string | undefined): string | null {
  const cleaned = cleanOptionalEnvValue(phone);
  if (!cleaned) return null;
  return normalizePhoneIdentifier(cleaned);
}

export async function seedSuperAdminUser({
  repository,
  email,
  phone,
  password
}: {
  repository: SuperAdminSeedRepository;
  email: string | undefined;
  phone?: string | undefined;
  password: string | undefined;
}): Promise<"seeded" | "skipped"> {
  const normalizedEmail = cleanOptionalEnvValue(email)?.toLowerCase();
  const normalizedPhone = normalizeOptionalPhone(phone);

  if (!normalizedEmail || !password) {
    return "skipped";
  }

  await repository.upsertSuperAdmin({
    email: normalizedEmail,
    phone: normalizedPhone,
    name: "FrameID Admin",
    passwordHash: await hashPassword(password)
  });

  return "seeded";
}
