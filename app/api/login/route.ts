import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "@/utils/generateToken";
import { User } from "@/store/userStore";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email и пароль обязательны" },
        { status: 400 }
      );
    }

    const conn = await getConnection();
    const [rows] = await conn.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const user = (rows as any[])[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    const userData: User = {
      id: user.id,
      role: user.role,
      email: user.email,
      access: user.access,
      create_time: user.create_time,
      code: user.code,
      name: user.name,
      inn: user.inn,
      kpp: user.kpp,
      legal_address: user.legal_address,
      actual_address: user.actual_address,
      active: user.active,
      phone: user.phone ? String(user.phone) : null,
    };

    const response = NextResponse.json({
      message: "Авторизация успешна",
      user: userData,
    });

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 60 * 15, // 15 минут
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
