import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { createAccessToken } from "@/utils/generateToken";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "Нет refresh токена" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;

    
    const conn = await getConnection();
    const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [
      payload.id,
    ]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }
    const dbUser = (rows as any[])[0];
    const { password, ...user } = dbUser; 

    const newAccessToken = createAccessToken(user);

    const response = NextResponse.json({
      message: "Access обновлён",
      user,
      accessToken: newAccessToken,
      expiresIn: 60 * 15,
    });

    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      // path: "/",
      maxAge: 60 * 15,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Refresh токен недействителен" },
      { status: 401 }
    );
  }
}
