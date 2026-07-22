"use server";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { templateDefinitions, themeDefinitions } from "@/modules/themes/definitions";
import { TEMPLATE_STARTER_DEFAULTS_CODE } from "@/modules/themes/template-starter-defaults";

/**
 * يزامن الثيمات والقوالب بين الكود وقاعدة البيانات
 * - يُنشئ أي ثيم/قالب جديد في الكود وغير موجود في DB
 * - لا يُحدّث السجلات الموجودة (يحافظ على التعديلات اليدوية)
 */
export async function syncTemplateDefinitionsIfNeeded() {
  if (!process.env.DATABASE_URL) return;

  try {
    // مزامنة الثيمات
    const dbThemes = await prisma.theme.findMany({
      where: { deletedAt: null },
      select: { code: true },
    });
    const dbThemeCodes = new Set(dbThemes.map(t => t.code));

    for (const themeDef of themeDefinitions) {
      if (dbThemeCodes.has(themeDef.code)) continue;
      try {
        await prisma.theme.create({
          data: {
            code: themeDef.code,
            name: themeDef.name,
            status: themeDef.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
            version: themeDef.version,
            category: "photography",
            defaultConfig: themeDef.defaultConfig as Prisma.InputJsonValue,
            contentSchema: { supportedSections: themeDef.supportedSections },
          },
        });
        console.log(`[sync] تم إنشاء ثيم جديد: ${themeDef.code}`);
      } catch { /* ignore duplicate */ }
    }

    // مزامنة القوالب
    const dbTemplates = await prisma.template.findMany({
      where: { deletedAt: null, code: { not: TEMPLATE_STARTER_DEFAULTS_CODE } },
      select: { code: true },
    });
    const dbTemplateCodes = new Set(dbTemplates.map(t => t.code));

    for (const templateDef of templateDefinitions) {
      if (templateDef.code === TEMPLATE_STARTER_DEFAULTS_CODE) continue;
      if (dbTemplateCodes.has(templateDef.code)) continue;

      const theme = await prisma.theme.findUnique({
        where: { code: templateDef.themeCode },
        select: { id: true },
      });

      if (!theme) continue; // needs theme to exist first

      try {
        await prisma.template.create({
          data: {
            themeId: theme.id,
            code: templateDef.code,
            name: templateDef.name,
            status: templateDef.status.toUpperCase() as "DRAFT" | "PUBLISHED" | "ARCHIVED",
            version: themeDefinitions.find(t => t.code === templateDef.themeCode)?.version ?? "1.0.0",
            showroomOrder: templateDef.showroomOrder,
            previewData: { description: templateDef.description },
            settings: templateDef.starterContent.themeSettings as Prisma.InputJsonValue,
          },
        });
        console.log(`[sync] تم إنشاء قالب جديد: ${templateDef.code}`);
      } catch { /* ignore duplicate */ }
    }
  } catch { /* DB unavailable */ }
}
