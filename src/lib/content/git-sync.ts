import "server-only";
import { readFile } from "node:fs/promises";

export type GitContentCommitResult = {
  enabled: boolean;
  commitSha?: string;
  error?: string;
};

type GitHubContentResponse = {
  sha?: string;
  commit?: { sha?: string };
};

function getGitHubConfig() {
  const token = process.env.GITHUB_CONTENT_TOKEN || process.env.BACKUP_GITHUB_TOKEN || "";
  const repository = process.env.GITHUB_REPOSITORY || "badrabdoph-cell/FrameID";
  const branch = process.env.GITHUB_CONTENT_BRANCH || process.env.RAILWAY_GIT_BRANCH || "main";
  if (!token) return null;
  return { token, repository, branch };
}

async function getCurrentFileSha(config: NonNullable<ReturnType<typeof getGitHubConfig>>, path: string): Promise<string | null> {
  const response = await fetch(`https://api.github.com/repos/${config.repository}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(config.branch)}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${config.token}`,
      "x-github-api-version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub SHA lookup failed for ${path}: ${response.status}`);
  const data = await response.json() as GitHubContentResponse;
  return data.sha ?? null;
}

async function putFile(config: NonNullable<ReturnType<typeof getGitHubConfig>>, path: string, content: string, message: string, sha: string | null): Promise<string | undefined> {
  const response = await fetch(`https://api.github.com/repos/${config.repository}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
      "x-github-api-version": "2022-11-28",
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf-8").toString("base64"),
      branch: config.branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`GitHub content commit failed for ${path}: ${response.status} ${details}`.trim());
  }

  const data = await response.json() as GitHubContentResponse;
  return data.commit?.sha;
}

export async function commitContentFilesToGitHub(input: { files: Array<{ path: string; absolutePath: string }>; message: string }): Promise<GitContentCommitResult> {
  const config = getGitHubConfig();
  if (!config) return { enabled: false };

  try {
    let lastCommitSha: string | undefined;
    for (const file of input.files) {
      const content = await readFile(file.absolutePath, "utf-8");
      const sha = await getCurrentFileSha(config, file.path);
      lastCommitSha = await putFile(config, file.path, content, input.message, sha) ?? lastCommitSha;
    }
    return { enabled: true, commitSha: lastCommitSha };
  } catch (error) {
    return { enabled: true, error: error instanceof Error ? error.message : "GitHub commit failed" };
  }
}
