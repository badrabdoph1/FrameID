import { z } from "zod";

const SectionStatusSchema = z.enum(["visible", "hidden"]);

export const PlatformPageSectionSchema = z.object({
  id: z.string().trim().min(1),
  type: z.string().trim().min(1),
  status: SectionStatusSchema,
  content: z.record(z.string(), z.unknown()),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const PlatformPageDocumentSchema = z
  .object({
    pageKey: z.string().trim().min(1),
    schemaVersion: z.number().int().positive(),
    sections: z.array(PlatformPageSectionSchema),
  })
  .superRefine((document, context) => {
    const identities = new Set<string>();

    for (const section of document.sections) {
      if (identities.has(section.id)) {
        context.addIssue({
          code: "custom",
          message: "هوية كل قسم يجب أن تكون فريدة",
          path: ["sections"],
        });
        return;
      }

      identities.add(section.id);
    }
  });

export type PlatformPageSection = z.infer<typeof PlatformPageSectionSchema>;
export type PlatformPageDocument = z.infer<typeof PlatformPageDocumentSchema>;

type PageFieldPath = Array<string | number>;

export type PageCommand =
  | {
      type: "set-section-status";
      sectionId: string;
      status: PlatformPageSection["status"];
    }
  | { type: "move-section"; sectionId: string; toIndex: number }
  | { type: "duplicate-section"; sectionId: string; newSectionId: string }
  | { type: "delete-section"; sectionId: string }
  | {
      type: "update-field";
      sectionId: string;
      path: PageFieldPath;
      value: unknown;
    };

export function parsePlatformPageDocument(input: unknown): PlatformPageDocument {
  return PlatformPageDocumentSchema.parse(input);
}

export function getVisibleSections(document: PlatformPageDocument): PlatformPageSection[] {
  return document.sections.filter((section) => section.status === "visible");
}

export function applyPageCommand(
  document: PlatformPageDocument,
  command: PageCommand,
): PlatformPageDocument {
  const sectionIndex = document.sections.findIndex((section) => section.id === command.sectionId);

  if (sectionIndex === -1) {
    throw new Error("القسم المطلوب غير موجود");
  }

  const sections = [...document.sections];

  switch (command.type) {
    case "set-section-status": {
      sections[sectionIndex] = { ...sections[sectionIndex], status: command.status };
      break;
    }

    case "move-section": {
      const [section] = sections.splice(sectionIndex, 1);
      const targetIndex = Math.max(0, Math.min(command.toIndex, sections.length));
      sections.splice(targetIndex, 0, section);
      break;
    }

    case "duplicate-section": {
      if (sections.some((section) => section.id === command.newSectionId)) {
        throw new Error("هوية القسم الجديد مستخدمة بالفعل");
      }

      const duplicate = cloneSection(sections[sectionIndex]);
      duplicate.id = command.newSectionId;
      sections.splice(sectionIndex + 1, 0, duplicate);
      break;
    }

    case "delete-section": {
      sections.splice(sectionIndex, 1);
      break;
    }

    case "update-field": {
      if (command.path.length === 0) {
        throw new Error("مسار التعديل غير صالح");
      }

      sections[sectionIndex] = {
        ...sections[sectionIndex],
        content: updateAtPath(sections[sectionIndex].content, command.path, command.value) as Record<
          string,
          unknown
        >,
      };
      break;
    }
  }

  const nextDocument: PlatformPageDocument = { ...document, sections };
  PlatformPageDocumentSchema.parse(nextDocument);
  return nextDocument;
}

function cloneSection(section: PlatformPageSection): PlatformPageSection {
  return structuredClone(section);
}

function updateAtPath(current: unknown, path: PageFieldPath, value: unknown): unknown {
  const [segment, ...remaining] = path;

  assertSafePathSegment(segment);

  if (Array.isArray(current)) {
    if (typeof segment !== "number" || !Number.isInteger(segment) || segment < 0) {
      throw new Error("مسار القائمة غير صالح");
    }

    const next = [...current];
    next[segment] = remaining.length === 0
      ? value
      : updateAtPath(next[segment], remaining, value);
    return next;
  }

  if (!isRecord(current) || typeof segment !== "string") {
    throw new Error("مسار التعديل غير موجود");
  }

  return {
    ...current,
    [segment]: remaining.length === 0
      ? value
      : updateAtPath(current[segment], remaining, value),
  };
}

function assertSafePathSegment(segment: string | number): void {
  if (
    typeof segment === "string" &&
    (segment === "__proto__" || segment === "prototype" || segment === "constructor")
  ) {
    throw new Error("مسار التعديل غير آمن");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
