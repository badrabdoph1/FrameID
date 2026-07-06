import { z } from "zod";

const signupInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be at most 80 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email must be valid")
    .max(160, "Email must be at most 160 characters"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  selectedTemplateCode: z.string().trim().min(1).max(80).optional()
});

export type SignupInput = z.infer<typeof signupInputSchema>;

export function parseSignupInput(input: unknown): SignupInput {
  return signupInputSchema.parse(input);
}
