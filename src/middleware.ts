import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants"

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"])

const CSP_HEADER = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://images.unsplash.com https://i.ibb.co`,
  `font-src 'self'`,
  `connect-src 'self'`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `block-all-mixed-content`,
].join("; ")

function setSecurityHeaders(response: NextResponse): void {
  response.headers.set("Content-Security-Policy", CSP_HEADER)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()")
}

function isValidTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}

async function isTokenValid(rawToken: string | undefined, origin: string): Promise<boolean> {
  if (!rawToken || !isValidTokenFormat(rawToken)) return false

  try {
    const res = await fetch(`${origin}/api/admin/validate-session`, {
      headers: { "x-admin-session-token": rawToken },
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
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
  } else {
    response = NextResponse.next()
  }

  setSecurityHeaders(response)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
