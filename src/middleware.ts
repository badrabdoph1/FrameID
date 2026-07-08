import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { ADMIN_SESSION_COOKIE_NAME } from "@/modules/admin/admin-session-constants"

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"])

function isValidTokenFormat(token: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(token)
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

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
