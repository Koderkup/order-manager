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
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;

    const { id: specificationId } = await context.params;

    conn = await getConnection();

    const [specProducts] = await conn.execute(
      `SELECT 
        p.id,
        p.code,
        p.name,
        p.article,
        sp.price as spec_price,
        p.price as base_price
       FROM specification_products sp
       LEFT JOIN products p ON sp.product_id = p.id
       WHERE sp.specification_id = ?
       ORDER BY p.name`,
      [specificationId]
    );
// console.log("specProducts", specProducts);
    return NextResponse.json({
      success: true,
      products: specProducts,
      count: Array.isArray(specProducts) ? specProducts.length : 0,
    });
  } catch (error) {
    console.error("Error fetching specification products:", error);
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
