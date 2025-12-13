import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";

export async function GET(request: NextRequest) {
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

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    conn = await getConnection();
    const [rows] = await conn.execute(
      `SELECT * FROM contracts ORDER BY start_date DESC`
    );

    return NextResponse.json({
      success: true,
      contracts: rows,
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function POST(request: NextRequest) {
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

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, start_date, end_date, amount, active = true } = body;


    if (!code || !name || !start_date || !end_date || !amount) {
      return NextResponse.json(
        { error: "Все обязательные поля должны быть заполнены" },
        { status: 400 }
      );
    }

    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: "Дата начала не может быть позже даты окончания" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [existing] = await conn.execute(
      "SELECT id FROM contracts WHERE code = ?",
      [code]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { error: "Договор с таким кодом уже существует" },
        { status: 409 }
      );
    }

    const [result] = await conn.execute(
      `INSERT INTO contracts (code, name, start_date, end_date, amount, active, client_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, name, start_date, end_date, amount, active, payload.id]
    );

    return NextResponse.json({
      success: true,
      message: "Договор успешно создан",
      contractId: (result as any).insertId,
    });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(request: NextRequest) {
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

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const body = await request.json();
    const { id, code, name, start_date, end_date, amount, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID договора обязателен" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [existing] = await conn.execute(
      "SELECT id FROM contracts WHERE id = ?",
      [id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({ error: "Договор не найден" }, { status: 404 });
    }

    if (code) {
      const [codeCheck] = await conn.execute(
        "SELECT id FROM contracts WHERE code = ? AND id != ?",
        [code, id]
      );

      if (Array.isArray(codeCheck) && codeCheck.length > 0) {
        return NextResponse.json(
          { error: "Договор с таким кодом уже существует" },
          { status: 409 }
        );
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (code !== undefined) {
      updateFields.push("code = ?");
      updateValues.push(code);
    }
    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (start_date !== undefined) {
      updateFields.push("start_date = ?");
      updateValues.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push("end_date = ?");
      updateValues.push(end_date);
    }
    if (amount !== undefined) {
      updateFields.push("amount = ?");
      updateValues.push(amount);
    }
    if (active !== undefined) {
      updateFields.push("active = ?");
      updateValues.push(active);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "Нет данных для обновления" },
        { status: 400 }
      );
    }

    updateValues.push(id);

    const query = `UPDATE contracts SET ${updateFields.join(
      ", "
    )} WHERE id = ?`;

    await conn.execute(query, updateValues);

    return NextResponse.json({
      success: true,
      message: "Договор успешно обновлен",
    });
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function DELETE(request: NextRequest) {
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

    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Доступ запрещен" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID договора обязателен" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [existing] = await conn.execute(
      "SELECT id FROM contracts WHERE id = ?",
      [id]
    );

    if (Array.isArray(existing) && existing.length === 0) {
      return NextResponse.json({ error: "Договор не найден" }, { status: 404 });
    }

    await conn.execute("DELETE FROM contracts WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Договор успешно удален",
    });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
