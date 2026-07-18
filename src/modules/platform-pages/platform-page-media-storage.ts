import { resolve } from "node:path";

import { createGitHubMediaStorage } from "@/modules/media/github-media-storage";

export function createPlatformPageMediaStorage() {
  const configuredPublicRoot = process.env.PLATFORM_MEDIA_PUBLIC_ROOT?.trim();
  if (process.env.NODE_ENV === "production" && !configuredPublicRoot) {
    throw new Error("تخزين صور الصفحات غير مهيأ على مساحة دائمة");
  }

  return createGitHubMediaStorage({
    publicRoot: configuredPublicRoot
      ? resolve(configuredPublicRoot)
      : resolve(process.cwd(), "public"),
    uploadsBasePath: "uploads/platform-pages",
  });
}
