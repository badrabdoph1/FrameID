const PHONE_EMAIL_DOMAIN = "phone.frameid.local";

export type AuthIdentifier =
  | {
      kind: "email";
      raw: string;
      email: string;
      phone: null;
      storageEmail: string;
    }
  | {
      kind: "phone";
      raw: string;
      email: null;
      phone: string;
      storageEmail: string;
    };

export function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function parseEmailOrPhoneIdentifier(value: string): AuthIdentifier {
  const raw = normalizeDigits(value).trim();

  if (!raw) {
    throw new Error("اكتب رقم الهاتف أو البريد الإلكتروني.");
  }

  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    if (!isValidEmail(email)) {
      throw new Error("البريد الإلكتروني غلط.");
    }

    return {
      kind: "email",
      raw,
      email,
      phone: null,
      storageEmail: email
    };
  }

  const phone = normalizePhoneIdentifier(raw);

  return {
    kind: "phone",
    raw,
    email: null,
    phone,
    storageEmail: buildPhoneStorageEmail(phone)
  };
}

export function normalizePhoneIdentifier(value: string): string {
  const trimmed = normalizeDigits(value).trim();
  let digits = trimmed.replace(/[^0-9+]/g, "");

  if (digits.startsWith("00")) {
    digits = `+${digits.slice(2)}`;
  }

  if (digits.startsWith("01") && digits.length === 11) {
    digits = `+20${digits.slice(1)}`;
  }

  if (digits.startsWith("1") && digits.length === 10) {
    digits = `+20${digits}`;
  }

  if (!digits.startsWith("+")) {
    digits = `+${digits.replace(/[^0-9]/g, "")}`;
  }

  const normalized = `+${digits.replace(/[^0-9]/g, "")}`;

  if (!/^\+[0-9]{8,15}$/u.test(normalized)) {
    throw new Error("رقم الهاتف غلط.");
  }

  return normalized;
}

export function buildPhoneStorageEmail(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  return `phone-${digits}@${PHONE_EMAIL_DOMAIN}`;
}

export function isPhoneStorageEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

export function getPublicAccountIdentifier(input: {
  email: string;
  phone?: string | null;
}): string {
  if (input.phone) {
    return input.phone;
  }

  return isPhoneStorageEmail(input.email) ? "رقم هاتف" : input.email;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value) && value.length <= 160;
}
