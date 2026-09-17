import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "vault_session";

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || "dev-session-secret-change-me";
  return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = await hasValidSession(request);

  if (pathname.startsWith("/vault") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/vault", request.url));
  }

  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/vault", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/vault/:path*"],
};
