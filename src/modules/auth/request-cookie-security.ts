import { headers } from "next/headers";

export async function shouldUseSecureSessionCookie() {
  const requestHeaders = await headers();
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  const origin = requestHeaders.get("origin") || requestHeaders.get("referer") || "";
  const host = requestHeaders.get("host") || "";

  if (origin.startsWith("https://") || forwardedProto === "https") return true;
  if (origin.startsWith("http://") || forwardedProto === "http") return false;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) return false;

  return process.env.NODE_ENV === "production";
}
