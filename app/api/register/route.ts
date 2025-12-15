import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createAccessToken, createRefreshToken } from "@/utils/generateToken";
import { User } from "@/store/userStore";

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
      phone,
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

    
    const [result] = await conn.execute(
      `INSERT INTO users 
        (email, password, code, name, inn, kpp, legal_address, actual_address, phone) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        email,
        hashed,
        code,
        name,
        inn,
        kpp || null,
        legal_address || null,
        actual_address || null,
        phone || null,
      ]
    );

    const [newUserRows] = await conn.execute(
      "SELECT * FROM users WHERE id = ?",
      [(result as any).insertId]
    );

    const dbUser = (newUserRows as any[])[0];

   
    const userData: User = {
      id: Number(dbUser.id),
      role: dbUser.role as "admin" | "client" | "manager", 
      email: String(dbUser.email),
      access: dbUser.access === 1 ? 1 : 0, 
      create_time: dbUser.create_time
        ? dbUser.create_time instanceof Date
          ? dbUser.create_time.toISOString()
          : String(dbUser.create_time)
        : new Date().toISOString(),
      code: dbUser.code ? String(dbUser.code) : null,
      name: dbUser.name ? String(dbUser.name) : null,
      inn: dbUser.inn ? String(dbUser.inn) : null,
      kpp: dbUser.kpp ? String(dbUser.kpp) : null,
      legal_address: dbUser.legal_address ? String(dbUser.legal_address) : null,
      actual_address: dbUser.actual_address
        ? String(dbUser.actual_address)
        : null,
      active: dbUser.active === 1, 
      phone: dbUser.phone ? String(dbUser.phone) : null,
    };

    const accessToken = createAccessToken(dbUser);
    const refreshToken = createRefreshToken(dbUser);

    const response = NextResponse.json(
      {
        message: "Регистрация успешна",
        user: userData,
      },
      { status: 201 }
    );

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 60 * 15,
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
