import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { createAccessToken } from "@/utils/generateToken";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!accessToken && refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
      const newAccessToken = createAccessToken(payload);

      const response = NextResponse.json({ user: payload });
      response.cookies.set("access_token", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 15, // 15 минут
      });
      return response;
    } catch {
      return NextResponse.json({ error: "Refresh истёк" }, { status: 401 });
    }
  }

  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
      return NextResponse.json({ user: payload });
    } catch {
      if (!refreshToken) {
        return NextResponse.json({ error: "Нет токенов" }, { status: 401 });
      }
      try {
        const payload = jwt.verify(
          refreshToken,
          process.env.JWT_SECRET!
        ) as any;
        const newAccessToken = createAccessToken(payload);

        const response = NextResponse.json({ user: payload });
        response.cookies.set("access_token", newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 15,
        });
        return response;
      } catch {
        return NextResponse.json({ error: "Refresh истёк" }, { status: 401 });
      }
    }
  }

  return NextResponse.json({ error: "Нет токенов" }, { status: 401 });
}


//1-й вариант

// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import jwt from "jsonwebtoken";

// export async function GET() {
//   const cookieStore = await cookies();
//   const accessToken = cookieStore.get("access_token")?.value;

//   if (!accessToken) {
//     return NextResponse.json({ error: "Нет access токена" }, { status: 401 });
//   }

//   try {
//     const payload = jwt.verify(
//       accessToken,
//       process.env.NEXT_PUBLIC_JWT_SECRET!
//     ) as any;

//     return NextResponse.json({
//       message: "Токен валиден",
//       user: {
//         id: payload.id,
//         name: payload.name,
//         sirname: payload.sirname,
//         email: payload.email,
//         inn: payload.inn,
//         role: payload.role,
//         access: payload.access,
//       },
//     });
//   } catch {
//     return NextResponse.json(
//       { error: "Access токен недействителен" },
//       { status: 401 }
//     );
//   }
// }

// если брать пользователя из базы данных
// import { NextResponse } from "next/server";
// import { cookies } from "next/headers";
// import jwt from "jsonwebtoken";
// import { getConnection } from "@/lib/db";
// import { createAccessToken } from "@/utils/generateToken";

// export async function GET() {
//   const cookieStore = await cookies();
//   const accessToken = cookieStore.get("access_token")?.value;
//   const refreshToken = cookieStore.get("refresh_token")?.value;

//   const getUserFromDb = async (id: number) => {
//     const conn = await getConnection();
//     const [rows] = await conn.execute("SELECT * FROM users WHERE id = ?", [id]);
//     return (rows as any[])[0];
//   };

//   // Если access нет, но есть refresh
//   if (!accessToken && refreshToken) {
//     try {
//       const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
//       const user = await getUserFromDb(payload.id);
//       const newAccessToken = createAccessToken(user);

//       const response = NextResponse.json({ user });
//       response.cookies.set("access_token", newAccessToken, {
//         httpOnly: true,
//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//         maxAge: 60 * 15,
//       });
//       return response;
//     } catch {
//       return NextResponse.json({ error: "Refresh истёк" }, { status: 401 });
//     }
//   }

//   // Если access есть
//   if (accessToken) {
//     try {
//       const payload = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
//       const user = await getUserFromDb(payload.id);
//       return NextResponse.json({ user });
//     } catch {
//       if (!refreshToken) {
//         return NextResponse.json({ error: "Нет токенов" }, { status: 401 });
//       }
//       try {
//         const payload = jwt.verify(
//           refreshToken,
//           process.env.JWT_SECRET!
//         ) as any;
//         const user = await getUserFromDb(payload.id);
//         const newAccessToken = createAccessToken(user);

//         const response = NextResponse.json({ user });
//         response.cookies.set("access_token", newAccessToken, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "strict",
//           maxAge: 60 * 15,
//         });
//         return response;
//       } catch {
//         return NextResponse.json({ error: "Refresh истёк" }, { status: 401 });
//       }
//     }
//   }

//   return NextResponse.json({ error: "Нет токенов" }, { status: 401 });
// }
