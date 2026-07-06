import { ZodError } from "zod";

export function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function getAuthActionErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return "راجع البيانات وحاول مرة أخرى.";
  }

  if (!(error instanceof Error)) {
    return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  }

  if (error.message === "Email already exists") {
    return "هذا البريد مستخدم بالفعل.";
  }

  if (error.message === "Invalid email or password") {
    return "البريد أو كلمة المرور غير صحيحة.";
  }

  if (error.message === "Selected template is not available") {
    return "القالب المختار غير متاح حاليًا.";
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}
