import { exec, execSync } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const execAsync = promisify(exec);

export type GitHubStorage = {
  uploadBackup(backupDir: string, backupId: string, branch: string): Promise<string>;
  downloadBackup(backupId: string, destDir: string, branch: string): Promise<string>;
  listBackups(branch: string): Promise<string[]>;
  cleanupOldBackups(branch: string, retentionCount: number): Promise<void>;
};

export function createGitHubStorage(token: string, repoPath?: string): GitHubStorage | null {
  if (!token) return null;

  function getRepoSlug(): string {
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

  return {
    async uploadBackup(
      backupDir: string,
      backupId: string,
      branch: string
    ): Promise<string> {
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-backup-"));
      const repoSlug = getRepoSlug();

      try {
        await execAsync(
          `git init && git remote add origin "https://x-access-token:${token}@github.com/${repoSlug}.git"`,
          { cwd: tmpDir }
        );

        const backupPath = join(tmpDir, "backups", backupId);
        await execAsync(`mkdir -p "${backupPath}"`, { cwd: tmpDir });

        await execAsync(`cp -r "${backupDir}/." "${backupPath}/"`, {
          cwd: tmpDir,
        });

        try {
          await execAsync(`git fetch origin ${branch} 2>/dev/null || true`, {
            cwd: tmpDir,
          });
          await execAsync(
            `git checkout ${branch} 2>/dev/null || git checkout --orphan ${branch}`,
            { cwd: tmpDir }
          );
        } catch {
          await execAsync(`git checkout --orphan ${branch}`, { cwd: tmpDir });
        }

        await execAsync('git config user.email "backup@frameid.app"', {
          cwd: tmpDir,
        });
        await execAsync('git config user.name "FrameID Backup"', { cwd: tmpDir });

        await execAsync(`git add -A`, { cwd: tmpDir });
        await execAsync(
          `git commit -m "backup: ${backupId}" --allow-empty`,
          { cwd: tmpDir }
        );
        await execAsync(
          `git push origin ${branch} --force`,
          { cwd: tmpDir, maxBuffer: 1024 * 1024 }
        );

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
      const repoSlug = getRepoSlug();
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-restore-"));

      try {
        await execAsync(
          `git clone --depth 1 --branch ${branch} "https://x-access-token:${token}@github.com/${repoSlug}.git" "${tmpDir}"`,
          { maxBuffer: 1024 * 1024 * 1024 }
        );

        const backupPath = join(tmpDir, "backups", backupId);
        if (!existsSync(backupPath)) {
          throw new Error(`Backup ${backupId} not found in GitHub branch ${branch}`);
        }

        await execAsync(`cp -r "${backupPath}/." "${destDir}/"`);
        return destDir;
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    },

    async listBackups(branch: string): Promise<string[]> {
      const repoSlug = getRepoSlug();
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-list-"));

      try {
        await execAsync(
          `git clone --depth 1 --branch ${branch} "https://x-access-token:${token}@github.com/${repoSlug}.git" "${tmpDir}"`,
          { maxBuffer: 1024 * 1024 }
        );

        const backupsDir = join(tmpDir, "backups");
        if (!existsSync(backupsDir)) return [];

        const { stdout } = await execAsync(`ls -1 "${backupsDir}"`, {
          cwd: tmpDir,
        });
        return stdout
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
      const repoSlug = getRepoSlug();
      const tmpDir = await mkdtemp(join(tmpdir(), "frameid-gh-clean-"));

      try {
        await execAsync(
          `git clone --depth 1 --branch ${branch} "https://x-access-token:${token}@github.com/${repoSlug}.git" "${tmpDir}"`,
          { maxBuffer: 1024 * 1024 }
        );

        for (const backupId of toDelete) {
          await execAsync(`rm -rf "${join(tmpDir, "backups", backupId)}"`, {
            cwd: tmpDir,
          });
        }

        await execAsync('git config user.email "backup@frameid.app"', {
          cwd: tmpDir,
        });
        await execAsync('git config user.name "FrameID Backup"', { cwd: tmpDir });
        await execAsync("git add -A", { cwd: tmpDir });
        await execAsync(
          'git commit -m "cleanup: remove old backups" --allow-empty',
          { cwd: tmpDir }
        );
        await execAsync(`git push origin ${branch} --force`, {
          cwd: tmpDir,
          maxBuffer: 1024 * 1024,
        });
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    },
  };
}


