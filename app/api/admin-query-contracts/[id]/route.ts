import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let conn: PoolConnection | null = null;
  try {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Не авторизован",
        },
        { status: 401 }
      );
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;

    const userId = payload.id;
    const userRole = payload.role;
    if (!userId) {
      return NextResponse.json(
        { error: "Неверная структура токена" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const { id: client_id } = await context.params;

    if (client_id) {
      if (userRole !== "admin") {
        return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
      }

      const [contracts] = await conn.execute(
        `SELECT * FROM contracts 
       WHERE client_id = ?`,
        [client_id]
      );

      if (Array.isArray(contracts) && contracts.length === 0) {
        return NextResponse.json(
          { error: "Договор не найден или у вас нет доступа" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        contracts: contracts,
        count: Array.isArray(contracts) ? contracts.length : 0,
      });
    }
  } catch (error) {
    console.error("Error fetching user contracts:", error);
    return NextResponse.json(
      {
        error: "Ошибка сервера",
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      } as { error: string; message: string },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
