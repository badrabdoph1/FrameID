import { ZodError } from "zod";

export function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key) ?? readServerActionFormValue(formData, key);
  return typeof value === "string" ? value : "";
}

function readServerActionFormValue(formData: FormData, key: string) {
  for (const [formKey, value] of formData.entries()) {
    if (formKey.endsWith(`_${key}`)) {
      return value;
    }
  }

  return null;
}

export function getAuthActionErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return "راجع البيانات وجرب تاني.";
  }

  if (!(error instanceof Error)) {
    return "حصل خطأ غير متوقع. حاول تاني.";
  }

  console.error("[auth-action-error]", error.constructor.name, error.message, error.stack?.split("\n").slice(0, 3).join("\n"));

  if (error.message === "Email already exists") {
    return "البريد دا مستخدم قبل كده.";
  }

  if (error.message === "Invalid email or password") {
    return "البريد أو كلمة السر غلط.";
  }

  if (error.message === "Selected template is not available") {
    return "القالب المختار مش متاح دلوقتي.";
  }

  if (
    error.message.includes("Environment variable not found: DATABASE_URL") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("P1001")
  ) {
    return "قاعدة البيانات مش متصلة دلوقتي. تأكد من DATABASE_URL وشغل قاعدة البيانات وجرب تاني.";
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
