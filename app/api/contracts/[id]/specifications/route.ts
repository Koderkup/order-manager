
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getConnection } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  let conn = null;
  try {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Не авторизован' },
        { status: 401 },
      );
    }

    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!,
    ) as jwt.JwtPayload;

    const { id: contractId } = await context.params;

    if (!contractId) {
      return NextResponse.json(
        { success: false, error: 'ID договора обязателен' },
        { status: 400 },
      );
    }

    conn = await getConnection();

    // Проверяем доступ к договору
    const [contractCheck] = await conn.execute<RowDataPacket[]>(
      `SELECT id, client_id FROM contracts WHERE id = ?`,
      [contractId],
    );

    if (contractCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Договор не найден' },
        { status: 404 },
      );
    }

    // Если пользователь не админ, проверяем что договор принадлежит ему
    if (payload.role !== 'admin' && contractCheck[0].client_id !== payload.id) {
      return NextResponse.json(
        { success: false, error: 'Нет доступа к этому договору' },
        { status: 403 },
      );
    }

    // Получаем спецификации по договору
    const [specifications] = await conn.execute<RowDataPacket[]>(
      `SELECT 
        s.id,
        s.code,
        s.name,
        s.contract_id,
        s.start_date,
        s.end_date,
        s.amount,
        s.active
       FROM specifications s
       WHERE s.contract_id = ?
       ORDER BY s.start_date DESC`,
      [contractId],
    );

    return NextResponse.json({
      success: true,
      specifications: specifications,
      count: specifications.length,
    });
  } catch (error) {
    console.error('Error fetching contract specifications:', error);
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




export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let conn = null;
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    
    if (!accessToken) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
    }
    
    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as jwt.JwtPayload;
    
    const { id: contractId } = await context.params;
    const body = await request.json();
    const { code, name, start_date, end_date, amount, active = 1 } = body;
    
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Название, дата начала и окончания обязательны" },
        { status: 400 }
      );
    }
    
    conn = await getConnection();
    
    // Проверяем доступ
    const [contractCheck] = await conn.execute<RowDataPacket[]>(
      `SELECT id FROM contracts WHERE id = ? AND client_id = ?`,
      [contractId, payload.id]
    );
    
    if (contractCheck.length === 0 && payload.role !== 'admin') {
      return NextResponse.json(
        { error: "Нет доступа к этому договору" },
        { status: 403 }
      );
    }
    
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO specifications (code, name, contract_id, start_date, end_date, amount, active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, name, contractId, start_date, end_date, amount, active],
    );
    
    return NextResponse.json({
      success: true,
      message: "Спецификация успешно создана",
      specificationId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating specification:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}