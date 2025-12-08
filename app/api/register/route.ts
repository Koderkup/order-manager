import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const {
      email,
      password,
      code,
      name,
      inn,
      kpp,
      legal_address,
      actual_address,
    } = await req.json();

    
    if (!email || !password || !code || !name || !inn) {
      return NextResponse.json(
        { error: "Email, пароль, код, наименование и ИНН обязательны" },
        { status: 400 }
      );
    }

    const conn = await getConnection();

   
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

   
    const hashed = await bcrypt.hash(password, 10);

   
    await conn.execute(
      `INSERT INTO users 
        (email, password, code, name, inn, kpp, legal_address, actual_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashed,
        code,
        name,
        inn,
        kpp ?? null,
        legal_address ?? null,
        actual_address ?? null,
      ]
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
