import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAccessToken } from "@/utils/generateToken";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

 
  if (!accessToken && refreshToken) {
    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.NEXT_PUBLIC_JWT_SECRET!
      ) as any;
      const newAccessToken = createAccessToken(payload);

      const response = NextResponse.json({
        user: payload,
        accessToken: newAccessToken, 
      });

      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: "strict",
        path: "/", 
        maxAge: 60 * 15, 
      });

      return response;
    } catch {
      return NextResponse.json({ error: "Refresh истёк" }, { status: 401 });
    }
  }


  if (accessToken) {
    try {
      const payload = jwt.verify(
        accessToken,
        process.env.NEXT_PUBLIC_JWT_SECRET!
      ) as any;
      return NextResponse.json({ user: payload });
    } catch {
      if (!refreshToken) {
        return NextResponse.json({ error: "Нет токенов" }, { status: 401 });
      }
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.NEXT_PUBLIC_JWT_SECRET!
        ) as any;
        const newAccessToken = createAccessToken(payload);

        const response = NextResponse.json({
          user: payload,
          accessToken: newAccessToken, 
        });

        response.cookies.set("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: "strict",
          path: "/",
          maxAge: 60 * 15,
        });

        return response;
      } catch {
        return NextResponse.json({ error: "Refresh истёк" }, { status: 401 });
      }
    }
  }

  return NextResponse.json({ error: "Нет токенов" }, { status: 401 });
}
