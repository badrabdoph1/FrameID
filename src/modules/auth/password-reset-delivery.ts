import { env } from "@/lib/env";
import { sendEmail, type SmtpConfig } from "@/modules/email/smtp-service";
import { buildPasswordResetEmailHtml } from "@/modules/email/password-reset-email";

function buildSmtpConfig(): SmtpConfig | null {
  if (!env.SMTP_HOST) return null;
  return {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    username: env.SMTP_USERNAME,
    password: env.SMTP_PASSWORD,
    fromName: env.SMTP_FROM_NAME,
    fromEmail: env.SMTP_FROM_EMAIL,
  };
}

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

  if (env.PASSWORD_RESET_DELIVERY_MODE === "email") {
    const smtpConfig = buildSmtpConfig();

    if (!smtpConfig) {
      console.info(`[Password Reset] SMTP not configured. Would send to ${input.email}: ${input.resetUrl}`);
      return;
    }

    const html = buildPasswordResetEmailHtml({
      userName: input.userName,
      resetUrl: input.resetUrl,
      expiresInMinutes: input.expiresInMinutes,
    });

    await sendEmail(smtpConfig, {
      to: input.email,
      subject: "استعادة كلمة المرور - FrameID",
      html,
    });
    return;
  }

  console.info(`[Password Reset] To: ${input.email}: ${input.resetUrl}`);
}
