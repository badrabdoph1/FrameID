import "server-only";

import type { PlatformPageDocument } from "@/modules/platform-pages/page-document";
import { createPrismaPlatformPageRepository } from "@/modules/platform-pages/prisma-page-repository";
import { createPlatformPageDocumentLoader } from "@/modules/platform-pages/page-service";

export async function loadPublishedPlatformPage(
  pageKey: string,
  legacyDocument: PlatformPageDocument,
): Promise<PlatformPageDocument> {
  if (!process.env.DATABASE_URL) {
    return legacyDocument;
  }

  try {
    const loader = createPlatformPageDocumentLoader(createPrismaPlatformPageRepository());
    return await loader.load(pageKey, legacyDocument);
  } catch {
    return legacyDocument;
  }
}

export async function loadPublishedPlatformPageState(
  pageKey: string,
  legacyDocument: PlatformPageDocument,
  legacyVersionTag: string,
): Promise<{ document: PlatformPageDocument; versionTag: string }> {
  if (!process.env.DATABASE_URL) {
    return { document: legacyDocument, versionTag: legacyVersionTag };
  }

  try {
    const stored = await createPrismaPlatformPageRepository().findByKey(pageKey);
    return stored
      ? { document: stored.document, versionTag: `page-${stored.version}` }
      : { document: legacyDocument, versionTag: legacyVersionTag };
  } catch {
    return { document: legacyDocument, versionTag: legacyVersionTag };
  }
}
