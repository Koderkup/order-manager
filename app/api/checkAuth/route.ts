import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Нет access токена" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;

    return NextResponse.json({
      message: "Токен валиден",
      user: {
        id: payload.id,
        name: payload.name,
        sirname: payload.sirname,
        email: payload.email,
        inn: payload.inn,
        role: payload.role,
        access: payload.access,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Access токен недействителен" },
      { status: 401 }
    );
  }
}
