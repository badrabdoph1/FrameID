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

export function resolveGitHubContentConfig(source: Record<string, string | undefined> = process.env) {
  const token = source.GITHUB_CONTENT_TOKEN || source.BACKUP_GITHUB_TOKEN || "";
  const repository = source.GITHUB_CONTENT_REPOSITORY
    || source.BACKUP_GITHUB_REPOSITORY
    || (source.RAILWAY_GIT_REPO_OWNER && source.RAILWAY_GIT_REPO_NAME
      ? `${source.RAILWAY_GIT_REPO_OWNER}/${source.RAILWAY_GIT_REPO_NAME}`
      : "");
  const branch = source.GITHUB_CONTENT_BRANCH || "main";
  if (!token || !repository) return null;
  return { token, repository, branch };
}

async function getCurrentFileSha(config: NonNullable<ReturnType<typeof resolveGitHubContentConfig>>, path: string): Promise<string | null> {
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

async function putFile(config: NonNullable<ReturnType<typeof resolveGitHubContentConfig>>, path: string, content: string, message: string, sha: string | null): Promise<string | undefined> {
  return putEncodedFile(config, path, Buffer.from(content, "utf-8").toString("base64"), message, sha);
}

async function putEncodedFile(config: NonNullable<ReturnType<typeof resolveGitHubContentConfig>>, path: string, encodedContent: string, message: string, sha: string | null): Promise<string | undefined> {
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
      content: encodedContent,
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

export async function commitPlatformAssetToGitHub(input: { path: string; bytes: Uint8Array; message: string }): Promise<GitContentCommitResult> {
  const config = resolveGitHubContentConfig();
  if (!config) return { enabled: false, error: "GitHub غير مضبوط لحفظ ملفات المنصة." };
  try {
    const sha = await getCurrentFileSha(config, input.path);
    const commitSha = await putEncodedFile(config, input.path, Buffer.from(input.bytes).toString("base64"), input.message, sha);
    return { enabled: true, commitSha };
  } catch (error) {
    return { enabled: true, error: error instanceof Error ? error.message : "فشل رفع ملف المنصة إلى GitHub" };
  }
}

export async function commitContentFilesToGitHub(input: { files: Array<{ path: string; absolutePath: string }>; message: string }): Promise<GitContentCommitResult> {
  const config = resolveGitHubContentConfig();
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
