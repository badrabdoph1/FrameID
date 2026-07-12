import { describe, expect, it } from "vitest";
import { createFrameIdBackupPipeline, type BackupPipelineDependencies } from "@/modules/backups/frameid-backup-pipeline";

function setup(fail?: string) { const events: string[] = []; const step = async <T>(name: string, value: T) => { events.push(name); if (fail === name) throw new Error(name); return value; }; const deps: BackupPipelineDependencies = {
  createJob: (input) => step("JOB", { id: "job", ...input }), createArtifact: ({ type }) => step("CREATE", { backupId: "id", backupDir: "/tmp/id", type, sizeBytes: 1, checksumSha256: "a".repeat(64) }),
  verifyArtifact: (_a, where) => step(where === "LOCAL" ? "LOCAL" : "REMOTE", { valid: true, sizeBytes: 1, errors: [] }), uploadArtifact: () => step("UPLOAD", { branch: "branch", commitSha: "sha", remotePath: "path" }),
  applyRetention: () => step("RETENTION", { removed: [] }), recordAudit: (e) => step(`AUDIT_${e.action}`, undefined), markCompleted: () => step("COMPLETED", undefined), markFailed: () => step("FAILED", undefined), cleanupLocalArtifact: () => step("CLEAN", undefined),
}; return { events, deps }; }

describe("FrameID Backup Pipeline", () => {
  it("تنفذ المراحل الرسمية بالترتيب", async () => { const { events, deps } = setup(); await createFrameIdBackupPipeline(deps).create({ type: "DATABASE", trigger: "MANUAL" }); expect(events).toEqual(["JOB", "AUDIT_BACKUP_STARTED", "CREATE", "LOCAL", "UPLOAD", "REMOTE", "RETENTION", "AUDIT_BACKUP_COMPLETED", "COMPLETED", "CLEAN"]); });
  it.each(["LOCAL", "UPLOAD", "REMOTE", "RETENTION", "AUDIT_BACKUP_COMPLETED"])("لا تكمل عند فشل %s", async (stage) => { const { events, deps } = setup(stage); await expect(createFrameIdBackupPipeline(deps).create({ type: "FULL", trigger: "AUTO" })).rejects.toThrow(); expect(events).toContain("FAILED"); expect(events).not.toContain("COMPLETED"); });
});
