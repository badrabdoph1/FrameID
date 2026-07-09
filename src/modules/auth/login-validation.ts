import { z } from "zod";

import { parseEmailOrPhoneIdentifier } from "@/modules/auth/auth-identifier";

const loginBaseSchema = z.object({
  identifier: z.string().trim().max(160).optional(),
  email: z.string().trim().max(160).optional(),
  password: z.string().min(1, "Password is required").max(128)
});

export type LoginInput = z.infer<typeof loginBaseSchema> & {
  email: string;
  phone: string | null;
  identifierKind: "email" | "phone";
};

export function parseLoginInput(input: unknown): LoginInput {
  const parsed = loginBaseSchema.parse(input);
  const identifier = parseEmailOrPhoneIdentifier(parsed.identifier || parsed.email || "");

  return {
    ...parsed,
    email: identifier.storageEmail,
    phone: identifier.phone,
    identifierKind: identifier.kind
  };
}
