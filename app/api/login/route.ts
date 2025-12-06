// import { NextResponse } from "next/server";
// import { getConnection } from "@/lib/db";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export async function POST(req: Request) {
//   try {
//     const { email, password } = await req.json();
//     if (!email || !password) {
//       return NextResponse.json(
//         { error: "Email и пароль обязательны" },
//         { status: 400 }
//       );
//     }

//     const conn = await getConnection();
//     const [rows] = await conn.execute("SELECT * FROM users WHERE email = ?", [
//       email,
//     ]);
//     if ((rows as any[]).length === 0) {
//       return NextResponse.json(
//         { error: "Пользователь не найден" },
//         { status: 404 }
//       );
//     }

//     const user = (rows as any[])[0];
//     const ok = await bcrypt.compare(password, user.password);
//     if (!ok) {
//       return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
//     }

//     // Генерация JWT
//     const token = jwt.sign(
//       { id: user.id, name: user.name, email: user.email, inn: user.inn },
//       process.env.NEXT_PUBLIC_JWT_SECRET!,
//       { expiresIn: "7d" }
//     );

//     // Устанавливаем httpOnly cookie
//     const response = NextResponse.json({
//       message: "Авторизация успешна",
//       user: { id: user.id, email: user.email, name: user.name },
//     });
//     response.cookies.set("token", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 60 * 60 * 24 * 7,
//     });

//     return response;
//   } catch (err: any) {
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }


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

    
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        inn: user.inn,
        role: user.role,
        access: user.access,
      },
      process.env.NEXT_PUBLIC_JWT_SECRET!,
      { expiresIn: "7d" }
    );

   
    const userData = {
      id: user.id,
      create_time: user.create_time,
      name: user.name,
      sirname: user.sirname,
      email: user.email,
      inn: user.inn,
      role: user.role,
      access: user.access,
    };

  
    const response = NextResponse.json({
      message: "Авторизация успешна",
      user: userData, 
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}