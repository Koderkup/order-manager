import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Токен и новый пароль обязательны" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 6 символов" },
        { status: 400 }
      );
    }

    const conn = await getConnection();

    const [rows] = await conn.execute(
      "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Неверный или просроченный токен" },
        { status: 400 }
      );
    }

    const user = users[0];

    const hashedPassword = await bcrypt.hash(password, 10);

    await conn.execute(
      "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    return NextResponse.json(
      {
        message: "Пароль успешно изменен",
        success: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Ошибка сервера: " + err.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          valid: false, 
          error: "Токен не предоставлен",
        },
        { status: 200 } 
      );
    }

    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT id, email FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );

    const users = rows as any[];
    if (users.length === 0) {
      return NextResponse.json(
        {
          valid: false, 
          error: "Неверный или просроченный токен",
        },
        { status: 200 } 
      );
    }

    const user = users[0];

    return NextResponse.json(
      {
        valid: true,
        email: user.email,
        message: "Токен действителен",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Token validation error:", err);
    return NextResponse.json(
      {
        valid: false, 
        error: "Ошибка проверки токена",
      },
      { status: 200 }
    );
  }
}