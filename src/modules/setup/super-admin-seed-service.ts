import { hashPassword } from "@/modules/auth/password-hashing";

export type SuperAdminSeedRepository = {
  upsertSuperAdmin(input: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<void>;
};

export async function seedSuperAdminUser({
  repository,
  email,
  password
}: {
  repository: SuperAdminSeedRepository;
  email: string | undefined;
  password: string | undefined;
}): Promise<"seeded" | "skipped"> {
  const normalizedEmail = email?.trim().toLowerCase();

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
