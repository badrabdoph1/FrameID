import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";

function getRepoSlug(repoPath?: string): string {
  if (repoPath) return repoPath;
  try {
    const result = execSync("git remote get-url origin", {
      encoding: "utf-8",
    });
    const url = result.toString().trim();
    const match = url.match(/[:/]([^/]+\/[^/.]+)(\.git)?$/);
    if (match) return match[1];
    return "";
  } catch {
    return "";
  }
}

function runGit(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, { cwd, stdio: "pipe" });
    let stderr = "";
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ${args[0]}: ${stderr}`));
    });
    child.on("error", reject);
  });
}

function createAuthenticatedUrl(repoSlug: string): string {
  return `https://github.com/${repoSlug}.git`;
}

function writeGitCredentials(): void {
  return;
}

export type GitHubStorage = {
  uploadBackup(backupDir: string, backupId: string, branch: string): Promise<string>;
  downloadBackup(backupId: string, destDir: string, branch: string): Promise<string>;
  listBackups(branch: string): Promise<string[]>;
  cleanupOldBackups(branch: string, retentionCount: number): Promise<void>;
};

export function createGitHubStorage(token: string, repoPath?: string): GitHubStorage | null {
  if (!token) return null;

  return {
    async uploadBackup(
      backupDir: string,
      backupId: string,
      branch: string
    ): Promise<string> {
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-backup-"));
      const repoSlug = getRepoSlug(repoPath);

      try {
        writeGitCredentials();

        await runGit(tmpDir, ["init"]);
        await runGit(tmpDir, [
          "remote", "add", "origin",
          createAuthenticatedUrl(repoSlug),
        ]);

        const backupPath = join(tmpDir, "backups", backupId);
        await mkdir(backupPath, { recursive: true });

        await runGit(tmpDir, ["fetch", "origin", branch, "--depth=1"]).catch(() => {});
        await runGit(tmpDir, ["checkout", branch]).catch(() =>
          runGit(tmpDir, ["checkout", "--orphan", branch])
        );

        await runGit(tmpDir, ["config", "user.email", "backup@frameid.app"]);
        await runGit(tmpDir, ["config", "user.name", "FrameID Backup"]);

        await runGit(tmpDir, ["add", "-A"]);
        await runGit(tmpDir, ["commit", "-m", `backup: ${backupId}`, "--allow-empty"]);

        const pushUrl = `https://x-access-token:${token}@github.com/${repoSlug}.git`;

        await new Promise<void>((resolve, reject) => {
          const child = spawn("git", ["push", pushUrl, `${branch}:${branch}`, "--force"], {
            cwd: tmpDir,
            stdio: "pipe",
            env: { ...process.env, GIT_ASKPASS: "echo", GIT_TERMINAL_PROMPT: "0" },
          });
          let stderr = "";
          child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
          child.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`git push: ${stderr}`));
          });
          child.on("error", reject);
        });

        return `https://github.com/${repoSlug}/tree/${branch}/backups/${backupId}`;
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    },

    async downloadBackup(
      backupId: string,
      destDir: string,
      branch: string
    ): Promise<string> {
      const repoSlug = getRepoSlug(repoPath);
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-restore-"));

      try {
        writeGitCredentials();

        const cloneUrl = `https://x-access-token:${token}@github.com/${repoSlug}.git`;

        await new Promise<void>((resolve, reject) => {
          const child = spawn("git", [
            "clone", "--depth", "1", "--branch", branch,
            cloneUrl, tmpDir,
          ], {
            stdio: "pipe",
            env: { ...process.env, GIT_ASKPASS: "echo", GIT_TERMINAL_PROMPT: "0" },
          });
          let stderr = "";
          child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
          child.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`git clone: ${stderr}`));
          });
          child.on("error", reject);
        });

        const backupPath = join(tmpDir, "backups", backupId);
        if (!existsSync(backupPath)) {
          throw new Error(`Backup ${backupId} not found in GitHub branch ${branch}`);
        }

        await runGit(tmpDir, ["clone", "-c", `credential.helper=store --file ${tmpDir}/.git-credentials`]);
        execSync(`cp -r "${backupPath}/." "${destDir}/"`);
        return destDir;
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    },

    async listBackups(branch: string): Promise<string[]> {
      const repoSlug = getRepoSlug(repoPath);
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-list-"));

      try {
        writeGitCredentials();
        const cloneUrl = `https://x-access-token:${token}@github.com/${repoSlug}.git`;

        await new Promise<void>((resolve, reject) => {
          const child = spawn("git", [
            "clone", "--depth", "1", "--branch", branch, cloneUrl, tmpDir,
          ], {
            stdio: "pipe",
            env: { ...process.env, GIT_ASKPASS: "echo", GIT_TERMINAL_PROMPT: "0" },
          });
          let stderr = "";
          child.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
          child.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`git clone: ${stderr}`));
          });
          child.on("error", reject);
        });

        const backupsDir = join(tmpDir, "backups");
        if (!existsSync(backupsDir)) return [];

        const result = execSync(`ls -1 "${backupsDir}"`, {
          cwd: tmpDir,
          encoding: "utf-8",
        });
        return result
          .trim()
          .split("\n")
          .filter(Boolean)
          .sort()
          .reverse();
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    },

    async cleanupOldBackups(
      branch: string,
      retentionCount: number
    ): Promise<void> {
      const backups = await this.listBackups(branch);
      if (backups.length <= retentionCount) return;

      const toDelete = backups.slice(retentionCount);
      const repoSlug = getRepoSlug(repoPath);
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-clean-"));

      try {
        writeGitCredentials();
        const cloneUrl = `https://x-access-token:${token}@github.com/${repoSlug}.git`;

        await runGit(tmpDir, [
          "clone", "--depth", "1", "--branch", branch, cloneUrl, tmpDir,
        ]);

        for (const backupId of toDelete) {
          execSync(`rm -rf "${join(tmpDir, "backups", backupId)}"`);
        }

        await runGit(tmpDir, ["config", "user.email", "backup@frameid.app"]);
        await runGit(tmpDir, ["config", "user.name", "FrameID Backup"]);
        await runGit(tmpDir, ["add", "-A"]);
        await runGit(tmpDir, ["commit", "-m", "cleanup: remove old backups", "--allow-empty"]);

        const pushUrl = `https://x-access-token:${token}@github.com/${repoSlug}.git`;
        await runGit(tmpDir, ["push", pushUrl, `${branch}:${branch}`, "--force"]);
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    },
  };
}
