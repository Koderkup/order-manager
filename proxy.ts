import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

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

 
  if (pathname.startsWith("/personal-account")) {
  
    if (payload.role !== "client" && payload.role !== "admin" && payload.role !== "manager") {
      return NextResponse.redirect(new URL("/403", request.url));
    }

  
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length >= 2) {
      const userIdFromPath = pathSegments[1];
      const userId = payload.userId || payload.id;

      if (
        (payload.role === "client" || payload.role === "manager") &&
        String(userIdFromPath) !== String(userId)
      ) {
        return NextResponse.redirect(new URL("/403", request.url));
      }
    
    }
  }

  if (pathname.startsWith("/users") && payload.role !== "admin") {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  if (
    pathname.startsWith("/contracts") &&
    payload.role !== "client" &&
    payload.role !== "manager" &&
    payload.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  if (
    pathname.startsWith("/my-orders") &&
    payload.role !== "client" &&
    payload.role !== "manager" &&
    payload.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  if (
    pathname.startsWith("/price") &&
    payload.role !== "client" &&
    payload.role !== "manager" &&
    payload.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/403", request.url));
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
