import { hashPassword } from "@/modules/auth/password-hashing";

export type SuperAdminSeedRepository = {
  upsertSuperAdmin(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<void>;
};

function cleanOptionalEnvValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  return trimmed.replace(/^['"]|['"]$/g, "").trim() || undefined;
}

export async function seedSuperAdminUser({
  repository,
  email,
  password
}: {
  repository: SuperAdminSeedRepository;
  email: string | undefined;
  password: string | undefined;
}): Promise<"seeded" | "skipped"> {
  const normalizedEmail = cleanOptionalEnvValue(email)?.toLowerCase();

  if (!normalizedEmail || !password) {
    return "skipped";
  }

  await repository.upsertSuperAdmin({
    email: normalizedEmail,
    name: "FrameID Admin",
    passwordHash: await hashPassword(password)
  });

  return "seeded";
}
