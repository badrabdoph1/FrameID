import { describe, expect, it } from "vitest";

import { resolveGitHubContentConfig } from "@/lib/content/git-sync";

describe("إعداد GitHub لمحتوى المنصة", () => {
  it("يستخدم مستودع النسخ نفسه وفرع main عند التشغيل على Railway", () => {
    expect(resolveGitHubContentConfig({
      BACKUP_GITHUB_TOKEN: "token",
      BACKUP_GITHUB_REPOSITORY: "badrabdoph1/FrameID",
    })).toEqual({
      token: "token",
      repository: "badrabdoph1/FrameID",
      branch: "main",
    });
  });

  it("يرفض الحفظ عندما لا يكون المستودع أو المفتاح مضبوطًا", () => {
    expect(resolveGitHubContentConfig({ BACKUP_GITHUB_TOKEN: "token" })).toBeNull();
    expect(resolveGitHubContentConfig({ BACKUP_GITHUB_REPOSITORY: "badrabdoph1/FrameID" })).toBeNull();
  });
});
