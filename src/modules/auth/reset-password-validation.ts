import { z } from "zod";

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(10, "كلمة المرور يجب أن تكون 10 أحرف على الأقل")
    .max(128, "كلمة المرور يجب ألا تتجاوز 128 حرفاً")
    .regex(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
    .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

export function parseResetPasswordInput(input: unknown): ResetPasswordInput {
  return resetPasswordInputSchema.parse(input);
}
