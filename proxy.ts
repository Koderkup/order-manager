import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const protectedRoutes = {
  "/personal-account": {
    allowedRoles: ["client", "manager", "admin"],
    checkUserId: true,
    adminBypass: true,
  },
  "/users": {
    allowedRoles: ["admin"],
    checkUserId: false,
    adminBypass: false,
  },
  "/contracts": {
    allowedRoles: ["client", "manager", "admin"],
    checkUserId: false,
    adminBypass: true,
  },
  "/my-orders": {
    allowedRoles: ["client", "manager", "admin"],
    checkUserId: false,
    adminBypass: true,
  },
  "/price": {
    allowedRoles: ["client", "manager", "admin"],
    checkUserId: false,
    adminBypass: true,
  },
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;


  const publicPaths = [
    "/auth",
    "/login", 
    "/api/auth",
    "/api/refresh",
    "/api/checkAuth",
    "/_next",
    "/static",
    "/",
  ];


  if (
    publicPaths.some((path) => pathname === path || pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    console.log(`Middleware: No refresh token, redirecting to /login`);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload = null;

  try {
    payload = jwt.verify(
      refreshToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;
  } catch (error) {
    console.log(`Middleware: Invalid refresh token, redirecting to /login`);

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("refresh_token");
    response.cookies.delete("access_token");
    return response;
  }

  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }


  let routeMatched = false;

  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      routeMatched = true;

  
      if (!config.allowedRoles.includes(payload.role)) {
        console.log(
          `Middleware: Role ${payload.role} not allowed for ${route}`
        );
        return NextResponse.redirect(new URL("/403", request.url));
      }


      if (config.checkUserId && route === "/personal-account") {
        const pathSegments = pathname.split("/").filter(Boolean);
        if (pathSegments.length >= 2) {
          const userIdFromPath = pathSegments[1];
          const userId = payload.userId || payload.id;

  
          if (
            (payload.role !== "admin" || !config.adminBypass) &&
            String(userIdFromPath) !== String(userId)
          ) {
            console.log(
              `Middleware: User ID mismatch, redirecting to /personal-account/${userId}`
            );
   
            return NextResponse.redirect(
              new URL(`/personal-account/${userId}`, request.url)
            );
          }
        }
      }

      console.log(`Middleware: Access granted to ${pathname}`);
      break;
    }
  }

  if (!routeMatched) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/contracts/:path*",
    "/personal-account/:path*",
    "/price/:path*",
    "/users/:path*",
    "/my-orders/:path*",
  ],
};
