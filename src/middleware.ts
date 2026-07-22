import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants"
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-tokens"

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"])
const SIGNED_ADMIN_TOKEN_PREFIX = "stateless"

const SYSTEM_API_PREFIXES = new Set([
  "/api/health",
  "/api/rate-limit",
  "/api/internal",
  "/api/admin",
])

function createTraceId(): string {
  return crypto.randomUUID().slice(0, 12)
}

function setSecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
}

function setTraceHeaders(response: NextResponse, requestId: string, correlationId: string): void {
  response.headers.set("x-request-id", requestId)
  response.headers.set("x-correlation-id", correlationId)
}

function nextWithTrace(headers: Headers): NextResponse {
  return NextResponse.next({ request: { headers } })
}

function getAdminTokenSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SEED_SUPER_ADMIN_PASSWORD ||
    "frameid-admin-session-development-secret"
  )
}

function base64UrlToBase64(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  return base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
}

function base64UrlDecode(value: string): string {
  return atob(base64UrlToBase64(value))
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

async function hmacSha256Base64Url(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message))
  return arrayBufferToBase64Url(signature)
}

function safeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return mismatch === 0
}

async function isValidSignedAdminToken(token: string): Promise<boolean> {
  if (!token.startsWith(`${SIGNED_ADMIN_TOKEN_PREFIX}.`)) return false
  const [, encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) return false

  try {
    const expectedSignature = await hmacSha256Base64Url(encodedPayload, getAdminTokenSecret())
    if (!safeEqualString(signature, expectedSignature)) return false

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { id?: string; email?: string; role?: string; exp?: number }
    if (!payload.id || !payload.email || !payload.role || !payload.exp) return false
    return payload.exp > Date.now()
  } catch {
    return false
  }
}

function isValidTokenFormat(token: string): boolean {
  if (token.startsWith(`${SIGNED_ADMIN_TOKEN_PREFIX}.`)) return true
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}

async function isTokenValid(rawToken: string | undefined, origin: string): Promise<boolean> {
  if (!rawToken || !isValidTokenFormat(rawToken)) return false

  if (rawToken.startsWith(`${SIGNED_ADMIN_TOKEN_PREFIX}.`)) {
    return isValidSignedAdminToken(rawToken)
  }

  try {
    const res = await fetch(`${origin}/api/admin/validate-session`, {
      headers: { "x-admin-session-token": rawToken },
      signal: AbortSignal.timeout(8000),
      cache: "no-store"
    })
    return res.ok
  } catch {
    try {
      const retryRes = await fetch(`${origin}/api/admin/validate-session`, {
        headers: { "x-admin-session-token": rawToken },
        signal: AbortSignal.timeout(5000)
      })
      return retryRes.ok
    } catch {
      return false
    }
  }
}

function isSystemApiPath(pathname: string): boolean {
  for (const prefix of SYSTEM_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true
  }
  return false
}

async function checkApiAccess(request: NextRequest): Promise<"ALLOW" | "DENY" | "PASS"> {
  const rawToken = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (!rawToken) return "PASS"

  try {
    const res = await fetch(
      `${request.nextUrl.origin}/api/internal/check-access?token=${encodeURIComponent(rawToken)}`,
      { 
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 0 }
      }
    )
    
    if (!res.ok && res.status >= 500) {
      const retryRes = await fetch(
        `${request.nextUrl.origin}/api/internal/check-access?token=${encodeURIComponent(rawToken)}`,
        { signal: AbortSignal.timeout(5000) }
      )
      const retryData = await retryRes.json()
      return retryData.allowed === true ? "ALLOW" : "DENY"
    }
    
    const data = await res.json()
    if (data.allowed !== true) {
      return "DENY"
    }
    return "ALLOW"
  } catch {
    return "PASS"
  }
}

async function checkSiteAccess(request: NextRequest): Promise<"ALLOW" | "DENY" | "PASS"> {
  const { pathname } = request.nextUrl
  const slug = pathname.replace(/^\/p\//, "").split("/")[0]
  if (!slug) return "PASS"

  try {
    const res = await fetch(
      `${request.nextUrl.origin}/api/internal/check-access?slug=${encodeURIComponent(slug)}`,
      { 
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 0 }
      }
    )
    
    if (!res.ok && res.status >= 500) {
      const retryRes = await fetch(
        `${request.nextUrl.origin}/api/internal/check-access?slug=${encodeURIComponent(slug)}`,
        { signal: AbortSignal.timeout(5000) }
      )
      const retryData = await retryRes.json()
      return retryData.allowed === true ? "ALLOW" : "DENY"
    }
    
    const data = await res.json()
    if (data.allowed !== true) {
      return "DENY"
    }
    return "ALLOW"
  } catch {
    return "PASS"
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPath = pathname.startsWith("/admin")
  const requestId = request.headers.get("x-request-id") ?? createTraceId()
  const correlationId = request.headers.get("x-correlation-id") ?? requestId
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)
  requestHeaders.set("x-correlation-id", correlationId)
  requestHeaders.set("x-pathname", pathname)
  requestHeaders.set("x-method", request.method)
  requestHeaders.set("x-url", request.url)

  let response: NextResponse

  if (isAdminPath) {
    const rawToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value

    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      if (await isTokenValid(rawToken, request.nextUrl.origin)) {
        response = NextResponse.redirect(new URL("/admin", request.url))
      } else {
        response = nextWithTrace(requestHeaders)
      }
    } else {
      if (!(await isTokenValid(rawToken, request.nextUrl.origin))) {
        response = NextResponse.redirect(new URL("/admin/login", request.url))
      } else {
        response = nextWithTrace(requestHeaders)
      }
    }
  } else if (pathname.startsWith("/api/") && !isSystemApiPath(pathname)) {
    const access = await checkApiAccess(request)
    if (access === "DENY") {
      response = new NextResponse(JSON.stringify({ error: "الخدمة غير متاحة حاليًا.", requestId, correlationId }), {
        status: 403,
        headers: { "content-type": "application/json" },
      })
    } else {
      response = nextWithTrace(requestHeaders)
    }
  } else if (pathname.startsWith("/p/")) {
    const access = await checkSiteAccess(request)
    if (access === "DENY") {
      const slug = pathname.replace(/^\/p\//, "").split("/")[0]
      const url = new URL("/expired", request.url)
      if (slug) url.searchParams.set("slug", slug)
      response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    } else {
      response = nextWithTrace(requestHeaders)
    }
  } else {
    response = nextWithTrace(requestHeaders)
  }

  setSecurityHeaders(response)
  setTraceHeaders(response, requestId, correlationId)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
