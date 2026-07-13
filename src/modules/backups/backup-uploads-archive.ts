import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";

async function waitForTar(child: ReturnType<typeof spawn>): Promise<void> {
  let stderr = "";
  child.stderr?.on("data", (chunk) => { stderr += String(chunk); });
  await new Promise<void>((resolve, reject) => {
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr.trim() || `tar exited with code ${code}`)));
    child.on("error", reject);
  });
}

export async function restoreUploadsArchive(archivePath: string, targetDir: string): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  const tar = spawn("tar", ["-xzf", archivePath, "-C", targetDir, "--strip-components=1"], { stdio: ["ignore", "inherit", "pipe"] });
  await waitForTar(tar);
}
