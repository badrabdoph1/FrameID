import { z } from "zod";

import { parseEmailOrPhoneIdentifier } from "@/modules/auth/auth-identifier";

const signupBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  identifier: z.string().trim().max(160).optional(),
  email: z.string().trim().max(160).optional(),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  selectedTemplateCode: z.string().trim().min(1).max(80).optional()
});

export type SignupInput = z.infer<typeof signupBaseSchema> & {
  email: string;
  phone: string | null;
  identifierKind: "email" | "phone";
};

export function parseSignupInput(input: unknown): SignupInput {
  const parsed = signupBaseSchema.parse(input);
  const identifier = parseEmailOrPhoneIdentifier(parsed.identifier || parsed.email || "");

  return {
    ...parsed,
    email: identifier.storageEmail,
    phone: identifier.phone,
    identifierKind: identifier.kind
  };
}
