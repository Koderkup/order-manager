import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
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
    const newAccessToken = createAccessToken(payload);

    const response = NextResponse.json({ message: "Access обновлён" });
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
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
