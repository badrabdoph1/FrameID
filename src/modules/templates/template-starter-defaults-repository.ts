import "server-only";

import { prisma } from "@/lib/prisma";
import type { TemplateContentSourceOptions } from "@/modules/templates/template-content-source";
import {
  normalizeTemplateStarterSharedDefaults,
  OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
  readTemplateStarterSharedOverrides,
  TEMPLATE_STARTER_DEFAULTS_CODE,
} from "@/modules/themes/template-starter-defaults";

export async function loadTemplateContentSourceOptions(
  templateCode: string,
): Promise<TemplateContentSourceOptions> {
  if (process.env.NODE_ENV === "test") return {};

  const [sharedRow, templateRow] = await Promise.all([
    prisma.template.findUnique({
      where: { code: TEMPLATE_STARTER_DEFAULTS_CODE },
      select: { previewData: true },
    }),
    prisma.template.findUnique({
      where: { code: templateCode },
      select: { previewData: true },
    }),
  ]);

  const sharedData = asRecord(sharedRow?.previewData)?.sharedDefaults;

  return {
    sharedDefaults: sharedData
      ? normalizeTemplateStarterSharedDefaults(sharedData)
      : OFFICIAL_TEMPLATE_STARTER_DEFAULTS,
    templateOverride: readTemplateStarterSharedOverrides(templateRow?.previewData),
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}
