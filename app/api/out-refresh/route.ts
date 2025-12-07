import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { createAccessToken } from "@/utils/generateToken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const refreshToken = authHeader?.split(" ")[1]; 

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Нет refresh токена" },
        { status: 400 }
      );
    }

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
   
   const user = {
     id: dbUser.id,
     name: dbUser.name,
     email: dbUser.email,
     inn: dbUser.inn,
     role: dbUser.role,
     access: dbUser.access,
   };

    const newAccessToken = createAccessToken(user);

    return NextResponse.json({
      message: "Access обновлён",
      accessToken: newAccessToken,
      expiresIn: 15 * 60,
    });
  } catch {
    return NextResponse.json(
      { error: "Refresh истёк или недействителен" },
      { status: 401 }
    );
  }
}