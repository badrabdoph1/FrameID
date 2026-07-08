import { Resend } from "resend";
import { env } from "@/lib/env";

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(env.RESEND_API_KEY);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const client = getClient();

  if (!client) {
    console.info(`[Resend] Not configured. Would send to ${input.to}: ${input.subject}`);
    return;
  }

  const { error } = await client.emails.send({
    from: `FrameID <${env.RESEND_FROM_EMAIL}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
