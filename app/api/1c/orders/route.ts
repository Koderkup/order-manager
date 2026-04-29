import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  const connection = await getConnection();

  try {
    const searchParams = request.nextUrl.searchParams;
    const clientINN = searchParams.get('client');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Валидация параметров
    if (!clientINN) {
      return NextResponse.json(
        {
          error: 'Неверные параметры запроса',
          message: 'Необходим параметр client (ИНН клиента)',
        },
        { status: 400 },
      );
    }

    if (!from || !to) {
      return NextResponse.json(
        {
          error: 'Неверные параметры запроса',
          message: 'Необходимы параметры from и to в формате YYYYMMDD',
        },
        { status: 400 },
      );
    }

    const dateRegex = /^\d{8}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return NextResponse.json(
        {
          error: 'Неверный формат даты',
          message: 'Даты должны быть в формате YYYYMMDD (например, 20260401)',
        },
        { status: 400 },
      );
    }

    const fromDate = `${from.slice(0, 4)}-${from.slice(4, 6)}-${from.slice(6, 8)}`;
    const toDate = `${to.slice(0, 4)}-${to.slice(4, 6)}-${to.slice(6, 8)}`;

    if (!/^\d{10,12}$/.test(clientINN)) {
      return NextResponse.json(
        {
          error: 'Неверный формат ИНН',
          message: 'ИНН должен содержать 10 или 12 цифр',
        },
        { status: 400 },
      );
    }

    
    const [users] = await connection.execute<RowDataPacket[]>(
      `SELECT id, inn, name, active, role 
       FROM users 
       WHERE inn = ?`,
      [clientINN],
    );

    console.log(
      `Поиск пользователя с ИНН ${clientINN}: найдено ${users.length} записей`,
    );

    if (users.length === 0) {
      connection.release();
      return NextResponse.json(
        {
          error: 'Пользователь не найден',
          message: `Пользователь с ИНН ${clientINN} не зарегистрирован в системе`,
        },
        { status: 404 },
      );
    }

    const user = users[0];

    // Проверяем, что пользователь активен
    // if (user.active !== 1) {
    //   connection.release();
    //   return NextResponse.json(
    //     {
    //       error: 'Пользователь деактивирован',
    //       message: `Пользователь с ИНН ${clientINN} деактивирован. Обратитесь к администратору.`,
    //     },
    //     { status: 403 },
    //   );
    // }

    const clientId = user.id;

    console.log(
      `Найден пользователь: ID=${clientId}, ИНН=${user.inn}, имя=${user.name}, роль=${user.role}`,
    );
    console.log(`Возвращаем заказы для client_id = ${clientId}`);

    //Получаем ВСЕ заказы, где client_id = ID пользователя (независимо от его роли)
    const [orders] = await connection.execute<RowDataPacket[]>(
      `SELECT 
        o.id,
        o.number,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') as createdDate,
        o.status,
        o.amount,
        c.code as contract_code,
        s.code as specification_code
      FROM orders o
      INNER JOIN contracts c ON o.contract_id = c.id
      INNER JOIN specifications s ON o.specification_id = s.id
      WHERE o.client_id = ? 
        AND o.order_date BETWEEN ? AND ?
      ORDER BY o.order_date DESC, o.id DESC`,
      [clientId, fromDate, toDate],
    );

    console.log(
      `Найдено заказов для пользователя ${clientINN} (client_id=${clientId}): ${orders.length}`,
    );

    if (orders.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const result = [];
    for (const order of orders) {
      const [products] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          p.code,
          op.price,
          op.quantity as qty
        FROM order_products op
        INNER JOIN products p ON op.product_id = p.id
        WHERE op.order_id = ?`,
        [order.id],
      );

      result.push({
        number: order.number,
        createdDate: order.createdDate,
        status: order.status === 'Новый' ? 'new' : 'formed',
        clientINN: clientINN,
        contract: order.contract_code,
        specification: order.specification_code,
        amount: parseFloat(order.amount),
        products: products.map((p) => ({
          code: p.code,
          price: parseFloat(p.price),
          qty: p.qty,
        })),
      });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Ошибка получения заказов для 1С:', error);
    return NextResponse.json(
      {
        error: 'Внутренняя ошибка сервера',
        message:
          error instanceof Error
            ? error.message
            : 'Неизвестная ошибка при получении заказов',
      },
      { status: 500 },
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
