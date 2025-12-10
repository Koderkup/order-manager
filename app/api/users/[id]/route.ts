import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {

  console.log("[API] Получен запрос на пользователя с id:", params.id);

  return NextResponse.json(
    { message: `Вы запросили пользователя с id = ${params.id}` },
    { status: 200 }
  );
}
