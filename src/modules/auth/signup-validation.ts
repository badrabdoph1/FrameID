import { z } from "zod";

import { parseEmailOrPhoneIdentifier } from "@/modules/auth/auth-identifier";

const signupBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "اكتب اسمك أو اسم الاستوديو على الأقل حرفين.")
    .max(80, "اسم الاستوديو طويل جدًا. اختصره إلى 80 حرفًا أو أقل."),
  identifier: z.string().trim().max(160, "البريد أو رقم الهاتف طويل جدًا.").optional(),
  email: z.string().trim().max(160, "البريد الإلكتروني طويل جدًا.").optional(),
  password: z
    .string()
    .min(8, "اكتب كلمة مرور من 8 أحرف على الأقل.")
    .max(128, "كلمة المرور طويلة جدًا."),
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
