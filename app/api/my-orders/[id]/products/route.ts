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

    const userId = payload.id;
    const { id: orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: "ID заказа обязателен" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [orderCheck] = await conn.execute(
      `SELECT o.* FROM orders o
       WHERE o.id = ? ${payload.role !== "admin" ? "AND o.client_id = ?" : ""}`,
      payload.role !== "admin" ? [orderId, userId] : [orderId]
    );

    if (Array.isArray(orderCheck) && orderCheck.length === 0) {
      return NextResponse.json(
        { error: "Заказ не найден или у вас нет доступа" },
        { status: 404 }
      );
    }

    const [orderProducts] = await conn.execute(
      `SELECT 
        op.id,
        op.order_id,
        op.product_id,
        op.price,
        op.quantity,
        op.total,
        p.code as product_code,
        p.name as product_name,
        p.article as product_article
       FROM order_products op
       LEFT JOIN products p ON op.product_id = p.id
       WHERE op.order_id = ?
       ORDER BY p.name`,
      [orderId]
    );
console.log("orderProducts", orderProducts);
    return NextResponse.json({
      success: true,
      products: orderProducts,
      count: Array.isArray(orderProducts) ? orderProducts.length : 0,
    });
  } catch (error) {
    console.error("Error fetching order products:", error);
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



export async function POST(
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

    const userId = payload.id;
    const { id: orderId } = await context.params;
    const body = await request.json();
    const { products } = body; 

    if (!orderId) {
      return NextResponse.json(
        { error: "ID заказа обязателен" },
        { status: 400 }
      );
    }

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: "Некорректный формат данных товаров" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [orderCheck] = await conn.execute(
      `SELECT o.* FROM orders o
       WHERE o.id = ? ${payload.role !== "admin" ? "AND o.client_id = ?" : ""}`,
      payload.role !== "admin" ? [orderId, userId] : [orderId]
    );

    if (Array.isArray(orderCheck) && orderCheck.length === 0) {
      return NextResponse.json(
        { error: "Заказ не найден или у вас нет доступа" },
        { status: 404 }
      );
    }

    await conn.beginTransaction();

    try {

      await conn.execute("DELETE FROM order_products WHERE order_id = ?", [
        orderId,
      ]);

      for (const product of products) {
        const { product_id, price, quantity } = product;

        if (!product_id || !price || !quantity) {
          throw new Error("Не все обязательные поля товара заполнены");
        }

        await conn.execute(
          `INSERT INTO order_products (order_id, product_id, price, quantity)
           VALUES (?, ?, ?, ?)`,
          [orderId, product_id, price, quantity]
        );
      }

      const [totalResult] = await conn.execute(
        `SELECT SUM(total) as total_amount FROM order_products WHERE order_id = ?`,
        [orderId]
      );

      const totalAmount = (totalResult as any[])[0].total_amount || 0;

      await conn.execute("UPDATE orders SET amount = ? WHERE id = ?", [
        totalAmount,
        orderId,
      ]);

      await conn.commit();

      return NextResponse.json({
        success: true,
        message: "Товары заказа успешно обновлены",
        totalAmount,
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating order products:", error);
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