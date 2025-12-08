import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { AppJwtPayload, createAccessToken } from "@/utils/generateToken";
import { User } from "@/store/userStore";

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

    function mapUserToJwtPayload(user: User): AppJwtPayload {
      return {
        id: user.id,
        role: user.role,
        email: user.email,
        access:
          typeof user.access === "boolean"
            ? user.access
              ? 1
              : 0
            : user.access,
        create_time: user.create_time,
        code: user.code ?? "",
        name: user.name ?? "",
        inn: user.inn ?? "",
        kpp: user.kpp ?? "",
        legal_address: user.legal_address ?? "",
        actual_address: user.actual_address ?? "",
        active: user.active ? 1 : 0,
      };
    }

    const user: User = {
      id: dbUser.id,
      role: dbUser.role,
      email: dbUser.email,
      access: dbUser.access,
      create_time: dbUser.create_time,
      code: dbUser.code ?? null,
      name: dbUser.name ?? null,
      inn: dbUser.inn ?? null,
      kpp: dbUser.kpp ?? null,
      legal_address: dbUser.legal_address ?? null,
      actual_address: dbUser.actual_address ?? null,
      active: dbUser.active,
    };

    const _user = mapUserToJwtPayload(user);
    const newAccessToken = createAccessToken(_user);

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
