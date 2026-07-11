import { z } from "zod";

import { parseEmailOrPhoneIdentifier } from "@/modules/auth/auth-identifier";

const signupBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اكتب اسمك أو اسم الاستوديو حرفين على الأقل.")
    .max(80, "الاسم ده طويل أوي. اقصره لـ 80 حرف أو أقل."),
  identifier: z.string().trim().max(160, "البريد أو الرقم ده طويل أوي.").optional(),
  email: z.string().trim().max(160, "البريد الإلكتروني ده طويل أوي.").optional(),
  password: z
    .string()
    .min(8, "كلمة المرور لازم فيها 8 أحرف على الأقل.")
    .max(128, "كلمة المرور ده طويلة أوي."),
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
