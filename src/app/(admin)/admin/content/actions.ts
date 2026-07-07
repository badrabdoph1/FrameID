"use server";

import { revalidatePath } from "next/cache";
import { getContent, saveContent } from "@/lib/content";
import type { ContentSchemaKey, SaveResult } from "@/lib/content";

export async function saveContentAction(
  type: ContentSchemaKey,
  data: unknown
): Promise<SaveResult> {
  const result = saveContent(type, data);
  if (result.success) {
    revalidatePath(`/admin/content/${type.replace("/", "/")}`);
    revalidatePath("/");
  }
  return result;
}

export type { ContentSchemaKey, SaveResult };
