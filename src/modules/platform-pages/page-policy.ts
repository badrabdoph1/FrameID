import { ZodError } from "zod";

import { getPlatformPageDefinition } from "@/modules/platform-pages/page-catalog";
import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";
import { parseHomeSectionContent } from "@/modules/platform-pages/home-page-content";

export function validatePlatformPagePolicy(
  pageKey: string,
  document: PlatformPageDocument,
): void {
  const definition = getPlatformPageDefinition(pageKey);
  if (!definition) {
    throw new Error("الصفحة غير مسجلة في نظام المحتوى");
  }

  const definitionsByType = new Map(definition.sections.map((section) => [section.type, section]));
  for (const section of document.sections) {
    const sectionDefinition = definitionsByType.get(section.type);
    if (!sectionDefinition) {
      throw new Error("تحتوي الصفحة على قسم غير مسجل");
    }
    if (!sectionDefinition.capabilities.hide && section.status !== "visible") {
      throw new Error(`لا يمكن إخفاء قسم ${sectionDefinition.label}`);
    }

    try {
      validateSectionContent(pageKey, section);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`محتوى قسم ${sectionDefinition.label} غير مكتمل`);
      }
      throw error;
    }
  }

  for (const sectionDefinition of definition.sections) {
    const matchingSections = document.sections.filter((section) => section.type === sectionDefinition.type);
    if (!sectionDefinition.capabilities.delete && matchingSections.length === 0) {
      throw new Error(`لا يمكن حذف قسم ${sectionDefinition.label}`);
    }
    if (!sectionDefinition.capabilities.duplicate && matchingSections.length > 1) {
      throw new Error(`لا يمكن نسخ قسم ${sectionDefinition.label}`);
    }
  }

  const protectedOrder = document.sections
    .filter((section) => definitionsByType.get(section.type)?.capabilities.move === false)
    .map((section) => section.type);
  const expectedProtectedOrder = definition.sections
    .filter((section) => section.capabilities.move === false)
    .map((section) => section.type);
  if (protectedOrder.some((type, index) => type !== expectedProtectedOrder[index])) {
    throw new Error("لا يمكن تغيير ترتيب الأقسام الوظيفية المحمية");
  }
}

function validateSectionContent(
  pageKey: string,
  section: PlatformPageDocument["sections"][number],
): void {
  switch (pageKey) {
    case "home":
      parseHomeSectionContent(section);
      return;
    default:
      throw new Error("لا يوجد مخطط محتوى مسجل لهذه الصفحة");
  }
}
