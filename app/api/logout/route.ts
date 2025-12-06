import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Выход выполнен" });

  // Удаляем access_token
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // сразу истекает
  });

  // Удаляем refresh_token
  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
  });

  return response;
}
