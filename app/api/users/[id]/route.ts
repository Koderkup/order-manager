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

    if (userIdFromPath !== userIdFromToken && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT id, email, name, role, inn, kpp, legal_address, actual_address, code, access, create_time, active FROM users WHERE id = ?",
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

   
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Запрещено" }, { status: 403 });
    }

    const body = await request.json();
    const { active } = body;

    conn = await getConnection();
    await conn.execute("UPDATE users SET active = ? WHERE id = ?", [
      active,
      id,
    ]);

    return NextResponse.json({
      success: true,
      message: `User ${id} updated`,
    });
  } catch (error) {
    console.error("[API] Error updating user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
