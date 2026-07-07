import { redirect } from "next/navigation";
import { processError } from "./error-service";

export async function withErrorRedirect<T>(
  fn: () => Promise<T>,
  options: {
    errorRedirect: string;
    action?: string;
    userId?: string;
    tenantId?: string;
  },
): Promise<T | never> {
  try {
    return await fn();
  } catch (error) {
    const { userError } = await processError(error, {
      userId: options.userId,
      tenantId: options.tenantId,
      metadata: { action: options.action },
    });

    const separator = options.errorRedirect.includes("?") ? "&" : "?";
    redirect(
      `${options.errorRedirect}${separator}error=${encodeURIComponent(userError.message)}`,
    );
  }
}
