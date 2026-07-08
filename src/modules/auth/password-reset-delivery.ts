import { env } from "@/lib/env";
import { sendEmail } from "@/modules/email/resend-service";
import { buildPasswordResetEmailHtml } from "@/modules/email/password-reset-email";

export async function sendPasswordResetLink(input: {
  email: string;
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): Promise<void> {
  if (env.PASSWORD_RESET_DELIVERY_MODE === "console") {
    console.info(`[Password Reset] To: ${input.email}`);
    console.info(`[Password Reset] URL: ${input.resetUrl}`);
    return;
  }

  if (env.PASSWORD_RESET_DELIVERY_MODE === "email" || !env.RESEND_API_KEY) {
    if (!env.RESEND_API_KEY) {
      console.info(`[Password Reset] Resend not configured. Would send to ${input.email}: ${input.resetUrl}`);
      return;
    }

    const html = buildPasswordResetEmailHtml({
      userName: input.userName,
      resetUrl: input.resetUrl,
      expiresInMinutes: input.expiresInMinutes,
    });

    await sendEmail({
      to: input.email,
      subject: "استعادة كلمة المرور - FrameID",
      html,
    });
    return;
  }

  console.info(`[Password Reset] To: ${input.email}: ${input.resetUrl}`);
}
