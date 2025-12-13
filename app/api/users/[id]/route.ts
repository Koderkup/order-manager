import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";

async function verifyToken(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return { error: "Unauthorized", status: 401 };
  }

  try {
    const payload = jwt.verify(
      accessToken,
      process.env.NEXT_PUBLIC_JWT_SECRET!
    ) as any;
    return { payload };
  } catch (error) {
    return { error: "Invalid token", status: 401 };
  }
}


function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}


function isAdmin(payload: any): boolean {
  return payload.role === "admin";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: PoolConnection | null = null;
  try {
    const { id } = await params;
    const { payload, error, status } = await verifyToken(request);
    if (error) return NextResponse.json({ error }, { status });

    const userIdFromToken = String(payload.userId || payload.id);
    const userIdFromPath = String(id);

  
    if (userIdFromPath !== userIdFromToken && !isAdmin(payload)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT id, email, name, role, inn, kpp, legal_address, actual_address, code, access, create_time, active, phone FROM users WHERE id = ?",
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = (rows as any[])[0];
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[API] Error fetching user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: PoolConnection | null = null;
  try {
    const { id } = await params;


    const { payload, error, status } = await verifyToken(request);
    if (error) return NextResponse.json({ error }, { status });


    if (!isAdmin(payload)) {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуются права администратора" },
        { status: 403 }
      );
    }

    const body = await request.json();

  
    if (body.active !== undefined && Object.keys(body).length === 1) {
  
      conn = await getConnection();
      await conn.execute("UPDATE users SET active = ? WHERE id = ?", [
        body.active,
        id,
      ]);

      return NextResponse.json({
        success: true,
        message: `Статус пользователя обновлен`,
      });
    }

    const {
      name,
      email,
      role,
      inn,
      kpp,
      legal_address,
      actual_address,
      code,
      access,
      active,
      phone,
    } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Некорректный email" },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Имя должно содержать минимум 2 символа" },
        { status: 400 }
      );
    }

    if (!["admin", "client", "manager"].includes(role)) {
      return NextResponse.json(
        { error: "Некорректная роль пользователя" },
        { status: 400 }
      );
    }

    if (String(payload.userId) === id && role !== "admin") {
      return NextResponse.json(
        { error: "Вы не можете снять с себя права администратора" },
        { status: 400 }
      );
    }
    conn = await getConnection();
    const [existingUsers] = await conn.execute(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    await conn.execute(
      `UPDATE users SET 
        name = ?, 
        email = ?, 
        role = ?, 
        inn = ?, 
        kpp = ?, 
        legal_address = ?, 
        actual_address = ?, 
        code = ?, 
        access = ?, 
        active = ?,
        phone = ?
      WHERE id = ?`,
      [
        name?.trim() || null,
        email?.trim().toLowerCase(),
        role,
        inn?.trim() || null,
        kpp?.trim() || null,
        legal_address?.trim() || null,
        actual_address?.trim() || null,
        code?.trim() || null,
        access || 0,
        active ? 1 : 0,
        phone?.trim() || null,
        id,
      ]
    );

    const [updatedRows] = await conn.execute(
      "SELECT id, email, name, role, inn, kpp, legal_address, actual_address, code, access, create_time, active, phone FROM users WHERE id = ?",
      [id]
    );

    const updatedUser = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: "Данные пользователя успешно обновлены",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[API] Error updating user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: PoolConnection | null = null;
  try {
    const { id } = await params;


    const { payload, error, status } = await verifyToken(request);
    if (error) return NextResponse.json({ error }, { status });

    if (!isAdmin(payload)) {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуются права администратора" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = [
      "name",
      "email",
      "role",
      "inn",
      "kpp",
      "legal_address",
      "actual_address",
      "code",
      "access",
      "active",
      "phone",
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);

        if (key === "email" && value) {
          if (!isValidEmail(value as string)) {
            return NextResponse.json(
              { error: "Некорректный email" },
              { status: 400 }
            );
          }
          values.push((value as string).trim().toLowerCase());

          const [existingUsers] = await conn!.execute(
            "SELECT id FROM users WHERE email = ? AND id != ?",
            [value, id]
          );

          if ((existingUsers as any[]).length > 0) {
            return NextResponse.json(
              { error: "Пользователь с таким email уже существует" },
              { status: 400 }
            );
          }
        } else if (key === "role") {

          if (String(payload.userId) === id && value !== "admin") {
            return NextResponse.json(
              { error: "Вы не можете снять с себя права администратора" },
              { status: 400 }
            );
          }
          values.push(value);
        } else if (key === "active") {
          values.push(value ? 1 : 0);
        } else if (key === "access") {
          values.push(value || 0);
        } else if (value === null || value === "") {
          values.push(null);
        } else {
          values.push(typeof value === "string" ? value.trim() : value);
        }
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Нет полей для обновления" },
        { status: 400 }
      );
    }

    conn = await getConnection();
    values.push(id);

    await conn.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Данные пользователя обновлены",
    });
  } catch (error) {
    console.error("[API] Error patching user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: PoolConnection | null = null;
  try {
    const { id } = await params;

    const { payload, error, status } = await verifyToken(request);
    if (error) return NextResponse.json({ error }, { status });

    if (!isAdmin(payload)) {
      return NextResponse.json(
        { error: "Доступ запрещен. Требуются права администратора" },
        { status: 403 }
      );
    }

    if (String(payload.userId) === id) {
      return NextResponse.json(
        { error: "Вы не можете удалить свой собственный аккаунт" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [userCheck] = await conn.execute(
      "SELECT id, email, name, role FROM users WHERE id = ?",
      [id]
    );

    if ((userCheck as any[]).length === 0) {
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
      );
    }

    const user = (userCheck as any[])[0];

    if (user.role === "admin") {
      const [adminCount] = await conn.execute(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND active = 1"
      );

      const adminCountNum = (adminCount as any[])[0].count;

      if (adminCountNum <= 1) {
        return NextResponse.json(
          { error: "Нельзя удалить последнего активного администратора" },
          { status: 400 }
        );
      }
    }

    await conn.execute("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: `Пользователь ${user.name} (${user.email}) успешно удален`,
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[API] Error deleting user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}