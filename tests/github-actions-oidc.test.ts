import { describe, expect, it } from "vitest";

import { validateGitHubActionsClaims } from "@/modules/backups/github-actions-oidc";

const valid = {
  iss: "https://token.actions.githubusercontent.com",
  aud: "frameid-backup",
  repository: "badrabdoph1/FrameID",
  ref: "refs/heads/main",
  workflow_ref: "badrabdoph1/FrameID/.github/workflows/backup.yml@refs/heads/main",
  event_name: "workflow_dispatch",
  exp: Math.floor(Date.now() / 1000) + 300,
  nbf: Math.floor(Date.now() / 1000) - 10,
};

describe("هوية GitHub Actions", () => {
  it("تقبل فقط Workflow النسخ الرسمي على main", () => {
    expect(validateGitHubActionsClaims(valid, "badrabdoph1/FrameID")).toBe(true);
  });

  it.each([
    ["repository", "attacker/FrameID"],
    ["ref", "refs/heads/feature"],
    ["workflow_ref", "badrabdoph1/FrameID/.github/workflows/other.yml@refs/heads/main"],
    ["aud", "wrong-audience"],
    ["event_name", "pull_request"],
  ])("ترفض claim غير مسموح: %s", (key, value) => {
    expect(validateGitHubActionsClaims({ ...valid, [key]: value }, "badrabdoph1/FrameID")).toBe(false);
  });
});
