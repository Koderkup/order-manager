import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';


const protectedRoutes = {
  '/personal-account': {
    allowedRoles: ['client', 'manager', 'admin'],
    checkUserId: true,
    adminBypass: true,
    allowInactive: true,
  },
  '/users': {
    allowedRoles: ['admin'],
    checkUserId: false,
    adminBypass: false,
    allowInactive: false,
  },
  '/contracts': {
    allowedRoles: ['client', 'manager', 'admin'],
    checkUserId: false,
    adminBypass: true,
    allowInactive: false,
  },
  '/my-orders': {
    allowedRoles: ['client', 'manager', 'admin'],
    checkUserId: false,
    adminBypass: true,
    allowInactive: false,
  },
  '/price': {
    allowedRoles: ['client', 'manager', 'admin'],
    checkUserId: false,
    adminBypass: true,
    allowInactive: false,
  },
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const publicPaths = [
    '/auth',
    '/403',
    '/api/login',
    '/api/register',
    '/api/out-refresh',
    '/api/reset-password',
    '/api/forgot-password',
    '/api/auth',
    '/api/refresh',
    '/api/checkAuth',
    '/inactive',
    '/api/logout',
    '/api/1c/sync', 
    '/api/1c/orders',
    '/_next',
    '/static',
  ];

  const isPublicPath = publicPaths.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(path + '/') ||
      pathname.startsWith(path),
  );

  if (isPublicPath) {
    console.log(`Public path: ${pathname}, skipping auth check`);
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    console.log(`No refresh token, redirecting to /auth`);
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  let payload = null;

  try {
    payload = jwt.verify(
      refreshToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as jwt.JwtPayload;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Ошибка входа');
    console.log(`Invalid refresh token, redirecting to /auth, ${err.message}`);

    const response = NextResponse.redirect(new URL('/auth', request.url));

    response.cookies.delete('refresh_token');
    response.cookies.delete('access_token');
    return response;
  }

  if (!payload) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  if (payload.active === 0) {
    const isMainPath = pathname === '/';
    const isOwnPersonalAccount = pathname === `/personal-account/${payload.id}`;
    const isAuthPath = pathname === '/auth';
    if (isMainPath || isOwnPersonalAccount || isAuthPath) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL('/inactive', request.url));
    }
  }

  for (const [route, config] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!config.allowedRoles.includes(payload.role)) {
        console.log(`Role ${payload.role} not allowed for ${route}`);
        return NextResponse.redirect(new URL('/403', request.url));
      }

      if (config.checkUserId && route === '/personal-account') {
        const pathSegments = pathname.split('/').filter(Boolean);
        if (pathSegments.length >= 2) {
          const userIdFromPath = pathSegments[1];
          const userId = payload.userId || payload.id;

          if (
            (payload.role !== 'admin' || !config.adminBypass) &&
            String(userIdFromPath) !== String(userId)
          ) {
            console.log(
              `User ID mismatch, redirecting to /personal-account/${userId}`,
            );
            return NextResponse.redirect(
              new URL(`/personal-account/${userId}`, request.url),
            );
          }
        }
      }

      console.log(`Access granted to ${pathname}`);
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
