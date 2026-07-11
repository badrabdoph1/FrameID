import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { spawn } from "node:child_process";

import { createSha256Checksum } from "@/modules/backups/backup-manifest";

export type GitHubBackupVerification = {
  valid: boolean;
  backupId: string;
  branch: string;
  commitSha: string | null;
  sizeBytes: number;
  errors: string[];
};

export type GitHubStorage = {
  uploadBackup(backupDir: string, backupId: string, branch: string): Promise<{ url: string; commitSha: string }>;
  downloadBackup(backupId: string, destDir: string, branch: string): Promise<string>;
  verifyBackup(backupId: string, branch: string): Promise<GitHubBackupVerification>;
  listBackups(branch: string): Promise<string[]>;
  cleanupOldBackups(branch: string, retentionCount: number): Promise<string[]>;
  deleteBackup(backupId: string, branch: string): Promise<void>;
};

function resolveRepoSlug(repoPath?: string): string {
  const explicit = repoPath?.trim();
  if (explicit) return explicit.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");

  const owner = process.env.RAILWAY_GIT_REPO_OWNER?.trim();
  const name = process.env.RAILWAY_GIT_REPO_NAME?.trim();
  if (owner && name) return `${owner}/${name}`;

  const configured = process.env.BACKUP_GITHUB_REPOSITORY?.trim();
  if (configured) return configured.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");

  throw new Error("BACKUP_GITHUB_REPOSITORY is required when Railway repository metadata is unavailable.");
}

function authenticatedUrl(token: string, repoSlug: string): string {
  return `https://x-access-token:${encodeURIComponent(token)}@github.com/${repoSlug}.git`;
}

async function runGit(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, GIT_ASKPASS: "echo", GIT_TERMINAL_PROMPT: "0" },
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `git ${args[0]} exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

async function cloneBranch(token: string, repoSlug: string, branch: string, targetDir: string): Promise<boolean> {
  try {
    await runGit(process.cwd(), ["clone", "--depth", "1", "--branch", branch, authenticatedUrl(token, repoSlug), targetDir]);
    return true;
  } catch {
    await mkdir(targetDir, { recursive: true });
    await runGit(targetDir, ["init"]);
    await runGit(targetDir, ["checkout", "--orphan", branch]);
    await runGit(targetDir, ["remote", "add", "origin", authenticatedUrl(token, repoSlug)]);
    return false;
  }
}

async function directorySize(path: string): Promise<number> {
  let total = 0;
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const itemPath = join(path, entry.name);
    if (entry.isDirectory()) total += await directorySize(itemPath);
    else total += (await stat(itemPath)).size;
  }
  return total;
}

async function verifyDirectory(backupDir: string, backupId: string, branch: string, commitSha: string | null): Promise<GitHubBackupVerification> {
  const errors: string[] = [];
  const manifestPath = join(backupDir, "manifest.json");
  const checksumPath = join(backupDir, "checksum.sha256");
  const databasePath = join(backupDir, "database.sql.gz");

  if (!existsSync(manifestPath)) errors.push("manifest.json is missing");
  if (!existsSync(checksumPath)) errors.push("checksum.sha256 is missing");
  if (!existsSync(databasePath)) errors.push("database.sql.gz is missing");

  if (errors.length === 0) {
    const manifestContent = await readFile(manifestPath, "utf-8");
    const expectedChecksum = (await readFile(checksumPath, "utf-8")).trim();
    const actualChecksum = createSha256Checksum(manifestContent);
    if (actualChecksum !== expectedChecksum) errors.push("Manifest checksum mismatch");

    try {
      const manifest = JSON.parse(manifestContent) as { backupType?: string };
      if (manifest.backupType === "FULL" && !existsSync(join(backupDir, "uploads.tar.gz"))) {
        errors.push("uploads.tar.gz is missing for FULL backup");
      }
    } catch {
      errors.push("manifest.json is invalid JSON");
    }

    if ((await stat(databasePath)).size <= 0) errors.push("database.sql.gz is empty");
  }

  return {
    valid: errors.length === 0,
    backupId,
    branch,
    commitSha,
    sizeBytes: existsSync(backupDir) ? await directorySize(backupDir) : 0,
    errors,
  };
}

export function createGitHubStorage(token: string, repoPath?: string): GitHubStorage | null {
  if (!token.trim()) return null;
  const repoSlug = resolveRepoSlug(repoPath);

  async function withBranch<T>(branch: string, operation: (repoDir: string, existed: boolean) => Promise<T>): Promise<T> {
    const tempRoot = await mkdtemp(join(tmpdir(), "frameid-github-backup-"));
    const repoDir = join(tempRoot, "repo");
    try {
      const existed = await cloneBranch(token, repoSlug, branch, repoDir);
      await runGit(repoDir, ["config", "user.email", "backup@frameid.app"]);
      await runGit(repoDir, ["config", "user.name", "FrameID Backup"]);
      return await operation(repoDir, existed);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  }

  async function push(repoDir: string, branch: string, message: string): Promise<string> {
    await runGit(repoDir, ["add", "-A"]);
    const status = await runGit(repoDir, ["status", "--porcelain"]);
    if (status) await runGit(repoDir, ["commit", "-m", message]);
    else await runGit(repoDir, ["commit", "--allow-empty", "-m", message]);
    await runGit(repoDir, ["push", "origin", `${branch}:${branch}`, "--force-with-lease"])
      .catch(() => runGit(repoDir, ["push", "origin", `${branch}:${branch}`, "--force"]));
    return runGit(repoDir, ["rev-parse", "HEAD"]);
  }

  return {
    async uploadBackup(backupDir, backupId, branch) {
      if (!existsSync(backupDir)) throw new Error(`Local backup directory not found: ${backupDir}`);
      const localVerification = await verifyDirectory(backupDir, backupId, branch, null);
      if (!localVerification.valid) throw new Error(`Local backup verification failed: ${localVerification.errors.join("; ")}`);

      const commitSha = await withBranch(branch, async (repoDir) => {
        const target = join(repoDir, "backups", backupId);
        await rm(target, { recursive: true, force: true });
        await mkdir(target, { recursive: true });
        await cp(backupDir, target, { recursive: true, force: true });
        return push(repoDir, branch, `backup(${branch}): ${backupId}`);
      });

      const remoteVerification = await this.verifyBackup(backupId, branch);
      if (!remoteVerification.valid) {
        throw new Error(`GitHub backup verification failed: ${remoteVerification.errors.join("; ")}`);
      }
      return {
        url: `https://github.com/${repoSlug}/tree/${branch}/backups/${backupId}`,
        commitSha,
      };
    },

    async downloadBackup(backupId, destDir, branch) {
      return withBranch(branch, async (repoDir) => {
        const source = join(repoDir, "backups", backupId);
        if (!existsSync(source)) throw new Error(`Backup ${backupId} not found in GitHub branch ${branch}`);
        await rm(destDir, { recursive: true, force: true });
        await mkdir(destDir, { recursive: true });
        await cp(source, destDir, { recursive: true, force: true });
        const verification = await verifyDirectory(destDir, backupId, branch, await runGit(repoDir, ["rev-parse", "HEAD"]));
        if (!verification.valid) throw new Error(`Downloaded backup verification failed: ${verification.errors.join("; ")}`);
        return destDir;
      });
    },

    async verifyBackup(backupId, branch) {
      return withBranch(branch, async (repoDir) => {
        const backupDir = join(repoDir, "backups", backupId);
        if (!existsSync(backupDir)) {
          return { valid: false, backupId, branch, commitSha: await runGit(repoDir, ["rev-parse", "HEAD"]).catch(() => null), sizeBytes: 0, errors: ["Backup not found in GitHub"] };
        }
        return verifyDirectory(backupDir, backupId, branch, await runGit(repoDir, ["rev-parse", "HEAD"]));
      });
    },

    async listBackups(branch) {
      return withBranch(branch, async (repoDir) => {
        const backupsDir = join(repoDir, "backups");
        if (!existsSync(backupsDir)) return [];
        return (await readdir(backupsDir, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => basename(entry.name))
          .sort()
          .reverse();
      });
    },

    async cleanupOldBackups(branch, retentionCount) {
      if (retentionCount < 1) return [];
      return withBranch(branch, async (repoDir) => {
        const backupsDir = join(repoDir, "backups");
        if (!existsSync(backupsDir)) return [];
        const backups = (await readdir(backupsDir, { withFileTypes: true }))
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
          .sort()
          .reverse();
        const removed = backups.slice(retentionCount);
        if (removed.length === 0) return [];
        for (const backupId of removed) await rm(join(backupsDir, backupId), { recursive: true, force: true });
        await push(repoDir, branch, `retention(${branch}): remove ${removed.length} old backup(s)`);
        return removed;
      });
    },

    async deleteBackup(backupId, branch) {
      await withBranch(branch, async (repoDir) => {
        const target = join(repoDir, "backups", backupId);
        if (!existsSync(target)) return;
        await rm(target, { recursive: true, force: true });
        await push(repoDir, branch, `delete(${branch}): ${backupId}`);
      });
    },
  };
}
