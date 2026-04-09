import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';
import { PoolConnection } from 'mysql2/promise';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let conn: PoolConnection | null = null;
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Не авторизован',
        },
        { status: 401 },
      );
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as jwt.JwtPayload;

    const userId = payload.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Неверная структура токена' },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const targetClientId = payload.role === 'admin' && id ? id : userId;

    conn = await getConnection();

    const [orders] = await conn.execute<RowDataPacket[]>(
      `SELECT
          o.id,
          o.code as order_code,
          o.number,
          o.order_date,
          o.status,  -- ✅ Теперь возвращаем статус как есть из БД
          o.client_id,
          o.contract_id,
          o.specification_id,
          o.amount,
          c.code as contract_code,
          c.name as contract_name,
          u.name as client_name
       FROM orders o
       LEFT JOIN contracts c ON o.contract_id = c.id
       LEFT JOIN users u ON o.client_id = u.id
       WHERE o.client_id = ?
       ORDER BY o.order_date DESC`,
      [targetClientId],
    );

    const formattedOrders = Array.isArray(orders)
      ? orders.map((order) => ({
          ...order,
          number: order.number || order.code,
        }))
      : [];

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      count: formattedOrders.length,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

// POST запрос - создание заказа
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let conn: PoolConnection | null = null;
  let orderNumber: string = '';

  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as jwt.JwtPayload;

    const userId = payload.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Неверная структура токена' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const {
      order_date,
      contract_id,
      specification_id,
      amount,
      status = 'Новый', 
    } = body;

    if (!order_date || !contract_id || !amount) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 },
      );
    }

    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Сумма заказа должна быть больше 0' },
        { status: 400 },
      );
    }

    conn = await getConnection();

    const [contractCheck] = await conn.execute<RowDataPacket[]>(
      `SELECT id FROM contracts WHERE id = ? AND client_id = ?`,
      [contract_id, userId],
    );

    if (Array.isArray(contractCheck) && contractCheck.length === 0) {
      return NextResponse.json(
        { error: 'Договор не найден или у вас нет доступа' },
        { status: 403 },
      );
    }

    
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const [todayCountResult] = await conn.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM orders WHERE DATE(order_date) = CURDATE()',
    );
    const todayCount = todayCountResult[0].count + 1;
    const counter = todayCount.toString().padStart(3, '0');

    orderNumber = `ORD${year}${month}${day}${counter}`;

    
    const dbStatus = status === 'Сформирован' ? 'Сформирован' : 'Новый';

    let finalSpecificationId = specification_id;
    if (!specification_id) {
      const [specResult] = await conn.execute<ResultSetHeader>(
        `INSERT INTO specifications (name, created_at)
         VALUES (?, NOW())`,
        [`Спецификация для заказа ${orderNumber}`],
      );
      finalSpecificationId = specResult.insertId;
    }

    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO orders (
        number,
        code,
        order_date,
        status,
        client_id,
        contract_id,
        specification_id,
        amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        orderNumber,
        order_date,
        dbStatus,
        userId,
        contract_id,
        finalSpecificationId,
        amount,
      ],
    );

    return NextResponse.json({
      success: true,
      message: 'Заказ успешно создан',
      orderId: result.insertId,
      orderNumber: orderNumber,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

// PUT запрос - обновление заказа
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let conn: PoolConnection | null = null;
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as jwt.JwtPayload;

    const userId = payload.id;
    const { id: orderId } = await context.params;
    const body = await request.json();
    const { status, amount, order_date, contract_id } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID заказа обязателен' },
        { status: 400 },
      );
    }

    conn = await getConnection();

    const [existingOrder] = await conn.execute(
      `SELECT o.* FROM orders o
       WHERE o.id = ? ${payload.role !== 'admin' ? 'AND o.client_id = ?' : ''}`,
      payload.role !== 'admin' ? [orderId, userId] : [orderId],
    );

    if (Array.isArray(existingOrder) && existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Заказ не найден или у вас нет доступа' },
        { status: 404 },
      );
    }

    const updateFields = [];
    const updateValues = [];

    
    if (status !== undefined) {
      if (status !== 'Новый' && status !== 'Сформирован') {
        return NextResponse.json(
          {
            error:
              "Недопустимый статус. Допустимые значения: 'Новый', 'Сформирован'",
          },
          { status: 400 },
        );
      }
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return NextResponse.json(
          { error: 'Сумма заказа должна быть больше 0' },
          { status: 400 },
        );
      }
      updateFields.push('amount = ?');
      updateValues.push(amount);
    }

    if (order_date !== undefined) {
      updateFields.push('order_date = ?');
      updateValues.push(order_date);
    }

    if (contract_id !== undefined) {
      const [contractCheck] = await conn.execute(
        `SELECT id FROM contracts WHERE id = ? AND client_id = ?`,
        [contract_id, userId],
      );

      if (Array.isArray(contractCheck) && contractCheck.length === 0) {
        return NextResponse.json(
          { error: 'Договор не найден или у вас нет доступа' },
          { status: 403 },
        );
      }
      updateFields.push('contract_id = ?');
      updateValues.push(contract_id);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для обновления' },
        { status: 400 },
      );
    }

    updateValues.push(orderId);

    const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;

    await conn.execute(query, updateValues);

    return NextResponse.json({
      success: true,
      message: 'Заказ успешно обновлен',
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}

// DELETE запрос
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let conn: PoolConnection | null = null;
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as jwt.JwtPayload;

    const userId = payload.id;
    const { id: orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID заказа обязателен' },
        { status: 400 },
      );
    }

    conn = await getConnection();

    const [existingOrder] = await conn.execute<RowDataPacket[]>(
      `SELECT o.* FROM orders o
       WHERE o.id = ? AND o.client_id = ?`,
      [orderId, userId],
    );

    if (Array.isArray(existingOrder) && existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Заказ не найден или у вас нет доступа' },
        { status: 404 },
      );
    }

    const order = existingOrder[0];
    
    if (order.status === 'Сформирован') {
      return NextResponse.json(
        { error: 'Нельзя удалить сформированный заказ' },
        { status: 400 },
      );
    }

    await conn.execute('DELETE FROM orders WHERE id = ?', [orderId]);

    return NextResponse.json({
      success: true,
      message: 'Заказ успешно удален',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      },
      { status: 500 },
    );
  } finally {
    if (conn) conn.release();
  }
}
