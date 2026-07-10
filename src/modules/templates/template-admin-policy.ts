export type TemplateAdminDefaults = {
  previewData: Record<string, unknown>;
  settings: Record<string, unknown>;
};

export function normalizeTemplateCode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function assertTemplateCode(value: string): string {
  const code = normalizeTemplateCode(value);
  if (!code || code.length < 3) {
    throw new Error("كود القالب يجب أن يكون 3 أحرف على الأقل ويحتوي على حروف إنجليزية أو أرقام فقط.");
  }
  return code;
}

export function nextAvailableTemplateCode(
  requestedCode: string,
  unavailableCodes: ReadonlySet<string>,
): string {
  const base = assertTemplateCode(requestedCode);
  if (!unavailableCodes.has(base)) return base;

  for (let suffix = 2; suffix <= 999; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!unavailableCodes.has(candidate)) return candidate;
  }

  throw new Error("تعذر إنشاء كود فريد للقالب.");
}

export function buildTemplateDefaults(input: {
  name: string;
  description?: string | null;
  themeDefaultConfig?: Record<string, unknown> | null;
}): TemplateAdminDefaults {
  return {
    previewData: {
      title: input.name.trim(),
      headline: input.name.trim(),
      description: input.description?.trim() || "قالب جاهز للتخصيص من لوحة FrameID.",
      subtitle: input.description?.trim() || "قالب جاهز للتخصيص من لوحة FrameID.",
      callToAction: "احجز الآن",
      hero: {
        headline: input.name.trim(),
        subheadline: input.description?.trim() || "اعرض أعمالك وخدماتك بأسلوب احترافي.",
      },
      packages: [],
      extras: [],
    },
    settings: { ...(input.themeDefaultConfig ?? {}) },
  };
}
