import { resolve } from "node:path";

import { createLocalMediaStorage } from "@/modules/media/local-media-storage";

export function createPlatformPageMediaStorage() {
  const configuredPublicRoot = process.env.PLATFORM_MEDIA_PUBLIC_ROOT?.trim();
  if (process.env.NODE_ENV === "production" && !configuredPublicRoot) {
    throw new Error("تخزين صور الصفحات غير مهيأ على مساحة دائمة");
  }

  return createLocalMediaStorage({
    publicRoot: configuredPublicRoot
      ? resolve(configuredPublicRoot)
      : resolve(process.cwd(), "public"),
    uploadsBasePath: "uploads/platform-pages",
  });
}
