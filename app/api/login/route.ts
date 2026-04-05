import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';
import {
  AppJwtPayload,
  createAccessToken,
  createRefreshToken,
} from '@/utils/generateToken';
import { User } from '@/store/userStore';
import { RowDataPacket } from 'mysql2';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 },
      );
    }

    const conn = await getConnection();
    const [rows] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }
    const tokenPayload: AppJwtPayload = {
      id: user.id,
      role: user.role,
      email: user.email,
      create_time: user.create_time,
      name: user.name,
      inn: user.inn,
      kpp: user.kpp,
      legal_address: user.legal_address,
      actual_address: user.actual_address,
      active: user.active,
      phone: user.phone ? String(user.phone) : null,
    };
    const accessToken = createAccessToken(tokenPayload);
    const refreshToken = createRefreshToken(tokenPayload);

    const userData: User = {
      id: user.id,
      role: user.role,
      email: user.email,
      create_time: user.create_time,
      name: user.name,
      inn: user.inn,
      kpp: user.kpp,
      legal_address: user.legal_address,
      actual_address: user.actual_address,
      active: user.active,
      phone: user.phone ? String(user.phone) : null,
    };

    const response = NextResponse.json({
      message: 'Авторизация успешна',
      user: userData,
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 60 * 15, // 15 минут
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      // secure: process.env.NODE_ENV === "production",
      // sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return response;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Ошибка .....');
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
