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

    if (!userId) {
      return NextResponse.json(
        { error: "Неверная структура токена" },
        { status: 400 }
      );
    }

    // Получаем ID из параметров маршрута
    const { id } = await context.params;

    // Определяем целевой client_id
    const targetClientId = payload.role === "admin" && id ? id : userId;

    conn = await getConnection();

    // Исправленный SQL запрос - используем c.code вместо c.number
    const [orders] = await conn.execute(
      `SELECT o.*, 
              c.code as contract_code, 
              c.name as contract_name,
              u.name as client_name 
       FROM orders o
       LEFT JOIN contracts c ON o.contract_id = c.id
       LEFT JOIN users_old u ON o.client_id = u.id
       WHERE o.client_id = ?
       ORDER BY o.order_date DESC`,
      [targetClientId]
    );

    return NextResponse.json({
      success: true,
      orders: orders,
      count: Array.isArray(orders) ? orders.length : 0,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
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
  let orderNumber: string = ""; 

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

    if (!userId) {
      return NextResponse.json(
        { error: "Неверная структура токена" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      order_date,
      contract_id,
      specification_id,
      amount,
      status = "В обработке",
    } = body;

    if (!order_date || !contract_id || !amount) {
      return NextResponse.json(
        { error: "Все обязательные поля должны быть заполнены" },
        { status: 400 }
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Сумма заказа должна быть больше 0" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [contractCheck] = await conn.execute(
      `SELECT id FROM contracts 
       WHERE id = ? AND client_id = ?`,
      [contract_id, userId]
    );

    if (Array.isArray(contractCheck) && contractCheck.length === 0) {
      return NextResponse.json(
        { error: "Договор не найден или у вас нет доступа" },
        { status: 403 }
      );
    }

    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const [todayCountResult] = await conn.execute(
      "SELECT COUNT(*) as count FROM orders WHERE DATE(order_date) = CURDATE()"
    );
    const todayCount = (todayCountResult as any[])[0].count + 1;

    const counter = todayCount.toString().padStart(3, "0");

    
    orderNumber = `ORD${year}${month}${day}${counter}`;

    console.log(
      `Generated order number: ${orderNumber}, length: ${orderNumber.length}`
    );

    if (orderNumber.length > 12) {
      console.warn(
        `Order number too long: ${orderNumber}, trimming to 12 chars`
      );
      orderNumber = orderNumber.slice(0, 12);
    }

    
    const [existingOrder] = await conn.execute(
      "SELECT id FROM orders WHERE number = ?",
      [orderNumber]
    );

    if (Array.isArray(existingOrder) && existingOrder.length > 0) {
      let attempt = 1;
      let newOrderNumber = orderNumber;
      while (
        Array.isArray(existingOrder) &&
        existingOrder.length > 0 &&
        attempt < 10
      ) {
        newOrderNumber = `${orderNumber.slice(0, 11)}${String.fromCharCode(
          64 + attempt
        )}`;
        const [check] = await conn.execute(
          "SELECT id FROM orders WHERE number = ?",
          [newOrderNumber]
        );
        if (Array.isArray(check) && check.length === 0) {
          orderNumber = newOrderNumber;
          break;
        }
        attempt++;
      }
    }

    let finalSpecificationId = specification_id;
    if (!specification_id) {
      const [specResult] = await conn.execute(
        `INSERT INTO specifications (name, created_at) 
         VALUES (?, NOW())`,
        [`Спецификация для заказа ${orderNumber}`]
      );
      finalSpecificationId = (specResult as any).insertId;
    }

    const [result] = await conn.execute(
      `INSERT INTO orders (number, order_date, status, client_id, contract_id, specification_id, amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        order_date,
        status,
        userId,
        contract_id,
        finalSpecificationId,
        amount,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Заказ успешно создан",
      orderId: (result as any).insertId,
      orderNumber: orderNumber,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка сервера",
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
        sqlError: (error as any).sqlMessage,
        orderNumberDebug: orderNumber, 
      },
      { status: 500 }
    );
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(
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
    const { status, amount, order_date, contract_id } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "ID заказа обязателен" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [existingOrder] = await conn.execute(
      `SELECT o.* FROM orders o
       WHERE o.id = ? ${payload.role !== "admin" ? "AND o.client_id = ?" : ""}`,
      payload.role !== "admin" ? [orderId, userId] : [orderId]
    );

    if (Array.isArray(existingOrder) && existingOrder.length === 0) {
      return NextResponse.json(
        { error: "Заказ не найден или у вас нет доступа" },
        { status: 404 }
      );
    }

    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      if (!["Выполнен", "В обработке", "Отменен"].includes(status)) {
        return NextResponse.json(
          { error: "Недопустимый статус заказа" },
          { status: 400 }
        );
      }
      updateFields.push("status = ?");
      updateValues.push(status);
    }

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return NextResponse.json(
          { error: "Сумма заказа должна быть больше 0" },
          { status: 400 }
        );
      }
      updateFields.push("amount = ?");
      updateValues.push(amount);
    }

    if (order_date !== undefined) {
      updateFields.push("order_date = ?");
      updateValues.push(order_date);
    }

    if (contract_id !== undefined) {
      const [contractCheck] = await conn.execute(
        `SELECT id FROM contracts 
         WHERE id = ? AND client_id = ?`,
        [contract_id, userId]
      );

      if (Array.isArray(contractCheck) && contractCheck.length === 0) {
        return NextResponse.json(
          { error: "Договор не найден или у вас нет доступа" },
          { status: 403 }
        );
      }
      updateFields.push("contract_id = ?");
      updateValues.push(contract_id);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "Нет данных для обновления" },
        { status: 400 }
      );
    }

    updateValues.push(orderId);

    const query = `UPDATE orders SET ${updateFields.join(", ")} WHERE id = ?`;

    await conn.execute(query, updateValues);

    return NextResponse.json({
      success: true,
      message: "Заказ успешно обновлен",
    });
  } catch (error) {
    console.error("Error updating order:", error);
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

export async function DELETE(
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

    const [existingOrder] = await conn.execute(
      `SELECT o.* FROM orders o
       WHERE o.id = ? AND o.client_id = ?`,
      [orderId, userId]
    );

    if (Array.isArray(existingOrder) && existingOrder.length === 0) {
      return NextResponse.json(
        { error: "Заказ не найден или у вас нет доступа" },
        { status: 404 }
      );
    }

    const order = (existingOrder as any[])[0];
    if (order.status === "Выполнен") {
      return NextResponse.json(
        { error: "Нельзя удалить выполненный заказ" },
        { status: 400 }
      );
    }

    await conn.execute("DELETE FROM orders WHERE id = ?", [orderId]);

    return NextResponse.json({
      success: true,
      message: "Заказ успешно удален",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
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
