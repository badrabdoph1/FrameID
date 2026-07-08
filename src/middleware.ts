import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants"
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-tokens"

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"])

const SYSTEM_API_PREFIXES = new Set([
  "/api/health",
  "/api/rate-limit",
  "/api/internal",
  "/api/admin",
])

function setSecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
}

function isValidTokenFormat(token: string): boolean {
  if (token.startsWith("stateless.")) return true
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}

async function isTokenValid(rawToken: string | undefined, origin: string): Promise<boolean> {
  if (!rawToken || !isValidTokenFormat(rawToken)) return false

  try {
    const res = await fetch(`${origin}/api/admin/validate-session`, {
      headers: { "x-admin-session-token": rawToken },
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
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
      { signal: AbortSignal.timeout(3000) }
    )
    const data = await res.json()
    if (data.allowed === false) {
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
      { signal: AbortSignal.timeout(3000) }
    )
    const data = await res.json()
    if (data.allowed === false) {
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

  let response: NextResponse

  if (isAdminPath) {
    const rawToken = request.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value

    if (PUBLIC_ADMIN_PATHS.has(pathname)) {
      if (await isTokenValid(rawToken, request.nextUrl.origin)) {
        response = NextResponse.redirect(new URL("/admin", request.url))
      } else {
        response = NextResponse.next()
      }
    } else {
      if (!(await isTokenValid(rawToken, request.nextUrl.origin))) {
        response = NextResponse.redirect(new URL("/admin/login", request.url))
      } else {
        response = NextResponse.next()
      }
    }
  } else if (pathname.startsWith("/api/") && !isSystemApiPath(pathname)) {
    const access = await checkApiAccess(request)
    if (access === "DENY") {
      response = new NextResponse(JSON.stringify({ error: "الاشتراك منتهي. يرجى تجديد الاشتراك." }), {
        status: 403,
        headers: { "content-type": "application/json" },
      })
    } else {
      response = NextResponse.next()
    }
  } else if (pathname.startsWith("/p/")) {
    const access = await checkSiteAccess(request)
    if (access === "DENY") {
      const url = new URL("/expired", request.url)
      response = NextResponse.rewrite(url)
    } else {
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  setSecurityHeaders(response)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
