import { z } from "zod";

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(10, "كلمة السر أقلها ١٠ حروف")
    .max(128, "كلمة السر مينفعش تزيد عن ١٢٨ حرف")
    .regex(/[A-Z]/, "كلمة السر لازم تحتوي على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "كلمة السر لازم تحتوي على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "كلمة السر لازم تحتوي على رقم واحد على الأقل"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export function parseResetPasswordInput(input: unknown): ResetPasswordInput {
  return resetPasswordInputSchema.parse(input);
}
