import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_SECRET } from "./lib/env";
import { routeAccessMap } from "./lib/settings";

const encodedSecret = new TextEncoder().encode(JWT_SECRET);

const matchers = Object.keys(routeAccessMap).map((route) => {
  const pattern = new RegExp(`^${route}$`);
  return {
    pattern,
    allowedRoles: routeAccessMap[route],
  };
});

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Immediately allow static files, images, favicon, and auth api
  if (
    pathname.includes(".") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session_token")?.value;

  let userRole: string | null = null;
  let userId: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedSecret, {
        algorithms: ["HS256"],
      });
      userRole = (payload.role as string) || null;
      userId = (payload.id as string) || null;
    } catch {
      // Invalid/expired token
    }
  }

  // If user is already authenticated and visits /sign-in, redirect to their role home
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    if (userRole) {
      return NextResponse.redirect(new URL(`/${userRole}`, req.url));
    }
    return NextResponse.next();
  }

  // Check matching route protection rules
  for (const { pattern, allowedRoles } of matchers) {
    if (pattern.test(pathname)) {
      if (!userRole) {
        const signInUrl = new URL("/sign-in", req.url);
        signInUrl.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(signInUrl);
      }

      if (!allowedRoles.includes(userRole)) {
        // Unauthorized for this specific role, redirect to user's dashboard
        return NextResponse.redirect(new URL(`/${userRole}`, req.url));
      }
    }
  }

  // Root redirect handled if user visits /
  if (pathname === "/") {
    if (userRole) {
      return NextResponse.redirect(new URL(`/${userRole}`, req.url));
    } else {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals, static files, images, favicon, public assets
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
    "/",
    "/(admin|accountant|teacher|student|parent|list)(.*)",
  ],
};
