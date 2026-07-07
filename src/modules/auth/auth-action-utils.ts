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
    return "راجع البيانات وحاول مرة أخرى.";
  }

  if (!(error instanceof Error)) {
    return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  console.error("[auth-action-error]", error.constructor.name, error.message, error.stack?.split("\n").slice(0, 3).join("\n"));

  if (error.message === "Email already exists") {
    return "هذا البريد مستخدم بالفعل.";
  }

  if (error.message === "Invalid email or password") {
    return "البريد أو كلمة المرور غير صحيحة.";
  }

  if (error.message === "Selected template is not available") {
    return "القالب المختار غير متاح حاليًا.";
  }

  if (
    error.message.includes("Environment variable not found: DATABASE_URL") ||
    error.message.includes("Can't reach database server") ||
    error.message.includes("P1001")
  ) {
    return "قاعدة البيانات غير متصلة حاليًا. تأكد من DATABASE_URL وتشغيل قاعدة البيانات ثم حاول مرة أخرى.";
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
