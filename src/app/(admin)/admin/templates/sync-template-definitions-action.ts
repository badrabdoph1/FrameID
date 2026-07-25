"use server";

import { prisma } from "@/lib/prisma";
import { templateDefinitions, themeDefinitions } from "@/modules/themes/definitions";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";
import type { Prisma } from "@prisma/client";

/**
 * يضمن وجود جميع الثيمات والقوالب المعرفة في الكود داخل قاعدة البيانات.
 * يُنشئ أي سجل مفقود تلقائياً (الثيم أولاً ثم القالب).
 */
export async function ensureTemplatesInDatabase() {
  if (!process.env.DATABASE_URL) return { created: 0 };

  let created = 0;

  try {
    // الخطوة 1: إنشاء الثيمات المفقودة أولاً
    const dbThemes = await prisma.theme.findMany({
      where: { deletedAt: null },
      select: { id: true, code: true },
    });
    const dbThemeByCode = new Map(dbThemes.map(t => [t.code, t.id]));

    for (const def of themeDefinitions) {
      if (dbThemeByCode.has(def.code)) continue;
      try {
        const t = await prisma.theme.create({
          data: {
            code: def.code,
            name: def.name,
            status: (def.status.toUpperCase() === "DRAFT" ? "DRAFT" : def.status.toUpperCase() === "ARCHIVED" ? "ARCHIVED" : "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
            version: def.version,
            category: "photography",
            defaultConfig: def.defaultConfig as Prisma.InputJsonValue,
            contentSchema: { supportedSections: def.supportedSections } as Prisma.InputJsonValue,
          },
        });
        dbThemeByCode.set(t.code, t.id);
        created++;
      } catch { /* تخطي إذا كان موجوداً بالفعل */ }
    }

    // الخطوة 2: إنشاء القوالب المفقودة
    const dbTemplates = await prisma.template.findMany({
      where: { deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
      select: { code: true },
    });
    const dbTemplateCodes = new Set(dbTemplates.map(t => t.code));

    for (const def of templateDefinitions) {
      if (def.code === TEMPLATE_STARTER_DEFAULTS_CODE) continue;
      if (dbTemplateCodes.has(def.code)) continue;

      const themeId = dbThemeByCode.get(def.themeCode);
      if (!themeId) continue; // يجب أن يكون الثيم موجوداً

      try {
        await prisma.template.create({
          data: {
            themeId,
            code: def.code,
            name: def.name,
            status: (def.status.toUpperCase() === "DRAFT" ? "DRAFT" : def.status.toUpperCase() === "ARCHIVED" ? "ARCHIVED" : "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED",
            version: themeDefinitions.find(t => t.code === def.themeCode)?.version ?? "1.0.0",
            showroomOrder: def.showroomOrder,
            previewData: { description: def.description } as Prisma.InputJsonValue,
            settings: def.starterContent.themeSettings as Prisma.InputJsonValue,
          },
        });
        created++;
      } catch { /* تخطي إذا كان موجوداً بالفعل */ }
    }
  } catch { /* DB غير متاحة */ }

  return { created };
}
