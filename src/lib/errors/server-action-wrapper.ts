import { redirect } from "next/navigation";
import { processError } from "./error-service";
import { createRequestContext } from "./request-context";
import type { ActionResult } from "./types";

function isRedirectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.message.includes("NEXT_REDIRECT")) return true;
  if (error.message === "redirect") return true;
  const digest = (error as { digest?: string }).digest;
  if (digest?.startsWith("NEXT_REDIRECT")) return true;
  return false;
}

function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as { digest?: string }).digest;
  return digest?.startsWith("NEXT_NOT_FOUND") ?? false;
}

type ActionFn<TArgs extends unknown[], T> = (
  ...args: TArgs
) => Promise<T>;

type WrappedAction<TArgs extends unknown[], T> = (
  ...args: TArgs
) => Promise<ActionResult<T>>;

export function createAction<TArgs extends unknown[], T>(
  fn: ActionFn<TArgs, T>,
): WrappedAction<TArgs, T> {
  return async (...args: TArgs): Promise<ActionResult<T>> => {
    const { requestId, correlationId, route, userAgent } =
      await createRequestContext();

    try {
      const data = await fn(...args);
      return { success: true, data, requestId, correlationId };
    } catch (error) {
      if (isRedirectError(error) || isNotFoundError(error)) {
        throw error;
      }

      const { userError, detail } = await processError(error, {
        metadata: { route, userAgent },
      });

      return {
        success: false,
        error: userError,
        detail,
        requestId,
        correlationId,
      };
    }
  };
}

export async function handleActionResult<T>(
  result: ActionResult<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: { code: string; message: string; suggestion?: string }) => void;
    successRedirect?: string;
    successMessage?: string;
    errorMessage?: string;
  },
): Promise<T | undefined> {
  if (result.success) {
    if (options?.successMessage) {
      const { notify } = await import("./notification-service");
      notify.success(options.successMessage, undefined, { requestId: result.requestId, correlationId: result.correlationId });
    }
    if (options?.successRedirect) {
      redirect(options.successRedirect);
    }
    options?.onSuccess?.(result.data);
    return result.data;
  } else {
    const { notify } = await import("./notification-service");
    notify.error({
      title: options?.errorMessage ?? result.error.message,
      description: options?.errorMessage ? result.error.message : undefined,
      error: result.error,
      detail: result.detail,
      requestId: result.requestId,
      correlationId: result.correlationId,
    });
    options?.onError?.(result.error);
    return undefined;
  }
}
