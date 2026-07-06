import { z } from "zod";

const loginInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email must be valid")
    .max(160, "Email must be at most 160 characters"),
  password: z.string().min(1, "Password is required").max(128)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export function parseLoginInput(input: unknown): LoginInput {
  return loginInputSchema.parse(input);
}
