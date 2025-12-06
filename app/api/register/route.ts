import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, sirname, email, password, inn } = await req.json();

    if (!name || !email || !password || !inn || !sirname) {
      return NextResponse.json(
        { error: "Все поля обязательны" },
        { status: 400 }
      );
    }

    const conn = await getConnection();

    // 1) Проверяем, есть ли такой email
    const [exists] = await conn.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if ((exists as any[]).length > 0) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 409 }
      );
    }

    // 2) Хешируем пароль и создаём пользователя
    const hashed = await bcrypt.hash(password, 10);
    await conn.execute(
      "INSERT INTO users (name, sirname, email, password, inn) VALUES (?, ?, ?, ?, ?)",
      [name, sirname, email, hashed, inn]
    );

    return NextResponse.json(
      { message: "Регистрация успешна" },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
