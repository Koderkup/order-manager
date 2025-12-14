import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contractId: string }> }
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

    const { contractId } = await context.params;

    if (!contractId) {
      return NextResponse.json(
        { error: "ID договора обязателен" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    let accessCheckQuery = "";
    let accessCheckParams: any[] = [];

    if (userRole === "admin") {
      accessCheckQuery = "SELECT id FROM contracts WHERE id = ?";
      accessCheckParams = [contractId];
    } else if (userRole === "client") {
      accessCheckQuery =
        "SELECT id FROM contracts WHERE id = ? AND client_id = ?";
      accessCheckParams = [contractId, userId];
    } else {
      accessCheckQuery = "SELECT id FROM contracts WHERE id = ?";
      accessCheckParams = [contractId];
    }

    const [accessResult] = await conn.execute(
      accessCheckQuery,
      accessCheckParams
    );

    if (Array.isArray(accessResult) && accessResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Доступ к договору запрещен" },
        { status: 403 }
      );
    }

  
    const [priceItems] = await conn.execute(
      `SELECT 
     p.id,
     p.code,
     p.name,
     p.article,
     COALESCE(sp.price, p.price) as price,
     'шт' as unit,
     s.code as spec_code,
     s.name as spec_name,
     c.code as contract_code
   FROM contracts c
   JOIN specifications s ON c.id = s.contract_id AND s.active = 1
   JOIN specification_products sp ON s.id = sp.specification_id
   JOIN products p ON sp.product_id = p.id AND p.active = 1
   WHERE c.id = ? 
   ORDER BY s.code, p.code`,
      [contractId]
    );

    return NextResponse.json({
      success: true,
      priceItems: priceItems,
      count: Array.isArray(priceItems) ? priceItems.length : 0,
    });
  } catch (error) {
    console.error("Error fetching price list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка сервера",
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}
