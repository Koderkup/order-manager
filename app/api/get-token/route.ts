import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

    
    const accessToken = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        inn: user.inn,
        role: user.role,
        access: user.access,
      },
      process.env.NEXT_PUBLIC_JWT_SECRET!,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.NEXT_PUBLIC_JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    // Время жизни в секундах
    const accessTimeout = 15 * 60; // 15 минут
    const refreshTimeout = 7 * 24 * 60 * 60; // 7 дней

  
    return NextResponse.json({
      message: "Токены выданы",
      accessToken,
      refreshToken,
      expiresIn: {
        access: accessTimeout,
        refresh: refreshTimeout,
      },
    });
  } catch (err: any) {
    console.error("get-token error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
