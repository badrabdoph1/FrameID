import { createPublicKey, verify as verifySignature, type JsonWebKey } from "node:crypto";

const ISSUER = "https://token.actions.githubusercontent.com";
const AUDIENCE = "frameid-backup";
const JWKS_URL = `${ISSUER}/.well-known/jwks`;
const ALLOWED_EVENTS = new Set(["schedule", "workflow_dispatch"]);

type Claims = Record<string, unknown> & {
  iss?: string;
  aud?: string | string[];
  repository?: string;
  ref?: string;
  workflow_ref?: string;
  event_name?: string;
  exp?: number;
  nbf?: number;
};

type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

let cachedKeys: { expiresAt: number; keys: Jwk[] } | null = null;

function decodeJson(value: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
}

function normalizeRepository(value: string): string {
  return value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "");
}

export function validateGitHubActionsClaims(claims: Claims, expectedRepository: string, now = Date.now()): boolean {
  const repository = normalizeRepository(expectedRepository);
  const nowSeconds = Math.floor(now / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  return claims.iss === ISSUER
    && audience.includes(AUDIENCE)
    && claims.repository === repository
    && claims.ref === "refs/heads/main"
    && claims.workflow_ref === `${repository}/.github/workflows/backup.yml@refs/heads/main`
    && typeof claims.event_name === "string"
    && ALLOWED_EVENTS.has(claims.event_name)
    && typeof claims.exp === "number"
    && claims.exp > nowSeconds
    && (typeof claims.nbf !== "number" || claims.nbf <= nowSeconds + 30);
}

async function getSigningKeys(): Promise<Jwk[]> {
  if (cachedKeys && cachedKeys.expiresAt > Date.now()) return cachedKeys.keys;
  const response = await fetch(JWKS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`تعذر جلب مفاتيح توقيع GitHub: ${response.status}`);
  const body = await response.json() as { keys?: Jwk[] };
  if (!Array.isArray(body.keys) || body.keys.length === 0) throw new Error("مفاتيح توقيع GitHub غير متاحة");
  cachedKeys = { keys: body.keys, expiresAt: Date.now() + 5 * 60_000 };
  return body.keys;
}

export async function verifyGitHubActionsOidcToken(token: string, expectedRepository: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const header = decodeJson(encodedHeader);
    const claims = decodeJson(encodedClaims) as Claims;
    if (header.alg !== "RS256" || typeof header.kid !== "string") return false;
    if (!validateGitHubActionsClaims(claims, expectedRepository)) return false;

    const key = (await getSigningKeys()).find((candidate) => candidate.kid === header.kid && candidate.kty === "RSA");
    if (!key) return false;
    return verifySignature(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedClaims}`),
      createPublicKey({ key, format: "jwk" }),
      Buffer.from(encodedSignature, "base64url"),
    );
  } catch {
    return false;
  }
}
