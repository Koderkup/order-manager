import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conn: PoolConnection | null = null;
  try {
    const { id } = await params;

    let accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      console.log("[API] No token found (cookie or header)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    let payload;
    try {
      payload = jwt.verify(
        accessToken,
        process.env.NEXT_PUBLIC_JWT_SECRET!
      ) as any;
      console.log("[API] JWT payload:", payload);
    } catch (error) {
      console.log("[API] JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userIdFromToken = String(payload.userId || payload.id);
    const userIdFromPath = String(id);

    console.log(
      `[API] Comparing IDs - Token: ${userIdFromToken}, Path: ${userIdFromPath}`
    );
    console.log(`[API] User role: ${payload.role}`);

    if (userIdFromPath !== userIdFromToken && payload.role !== "admin") {
      console.log(`[API] Access denied - not own account and not admin`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    conn = await getConnection();
    console.log(`[API] Querying user with ID: ${id}`);

    const [rows] = await conn.execute(
      "SELECT id, email, name, role, inn, kpp, legal_address, actual_address, code, access, create_time, active FROM users WHERE id = ?",
      [id]
    );

    console.log(`[API] Query result: ${(rows as any[]).length} rows found`);

    if ((rows as any[]).length === 0) {
      console.log(`[API] User with ID ${id} not found in database`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = (rows as any[])[0];
    console.log(`[API] User found:`, user);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("[API] Error fetching user:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
