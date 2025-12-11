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
  const accessToken = request.cookies.get("access_token")?.value;
  const pathname = request.nextUrl.pathname;

 
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/refresh") ||
    pathname === "/auth" ||
    pathname === "/" ||
    pathname === "/api/checkAuth" ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  
  if (!accessToken) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  let payload = null;

  
  try {
    payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;
  } catch (error) {
    console.log("Access token invalid, redirecting to auth");
    return NextResponse.redirect(new URL("/auth", request.url));
  }

 
  if (!payload) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  
  console.log(
    `Checking access for ${pathname}, user role: ${payload.role}, user ID: ${
      payload.userId || payload.id
    }`
  );

 
  let routeMatched = false;

  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      routeMatched = true;

      
      if (!config.allowedRoles.includes(payload.role)) {
        console.log(
          `Access denied: role ${payload.role} not allowed for ${route}`
        );
        return NextResponse.redirect(new URL("/403", request.url));
      }

    
      if (config.checkUserId) {
        const pathSegments = pathname.split("/").filter(Boolean);
        if (pathSegments.length >= 2) {
          const userIdFromPath = pathSegments[1];
          const userId = payload.userId || payload.id;

         
          if (
            (payload.role !== "admin" || !config.adminBypass) &&
            String(userIdFromPath) !== String(userId)
          ) {
            console.log(
              `Access denied: user ID mismatch (path: ${userIdFromPath}, token: ${userId})`
            );
            return NextResponse.redirect(new URL("/403", request.url));
          }
        }
      }

      console.log(`Access granted to ${pathname}`);
      break; 
    }
  }

  if (!routeMatched && !pathname.startsWith("/api/")) {
    console.log(
      `Route ${pathname} not found in protected routes, denying access`
    );
    return NextResponse.redirect(new URL("/403", request.url));
  }

  
  if (pathname.startsWith("/api/")) {
    const publicApiEndpoints = ["/api/auth", "/api/refresh", "/api/checkAuth"];
    const isPublicApi = publicApiEndpoints.some((endpoint) =>
      pathname.startsWith(endpoint)
    );

    if (!isPublicApi && !accessToken) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
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


