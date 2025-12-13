import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getConnection } from "@/lib/db";
import { PoolConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";

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
      "SELECT id, email, name, phone, role, inn, kpp, legal_address, actual_address, code, access, create_time, active FROM users WHERE id = ?",
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

    const userIdFromToken = String(payload.userId || payload.id);
    const userIdFromPath = String(id);

    if (userIdFromPath !== userIdFromToken && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, inn, kpp, legal_address, actual_address, email, phone } =
      body;

    conn = await getConnection();

    const [existingRows] = await conn.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    if (email) {
      const [emailRows] = await conn.execute(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id]
      );
      if ((emailRows as any[]).length > 0) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 409 }
        );
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      updateValues.push(name);
    }
    if (inn !== undefined) {
      updateFields.push("inn = ?");
      updateValues.push(inn);
    }
    if (kpp !== undefined) {
      updateFields.push("kpp = ?");
      updateValues.push(kpp);
    }
    if (legal_address !== undefined) {
      updateFields.push("legal_address = ?");
      updateValues.push(legal_address);
    }
    if (actual_address !== undefined) {
      updateFields.push("actual_address = ?");
      updateValues.push(actual_address);
    }
    if (email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(email);
    }
    if (phone !== undefined) {
      updateFields.push("phone = ?");
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No data to update" }, { status: 400 });
    }

    updateValues.push(id);

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    await conn.execute(query, updateValues);

    
    const [updatedRows] = await conn.execute(
      "SELECT id, email, name, role, inn, kpp, legal_address, actual_address, phone, code, access, create_time, active FROM users WHERE id = ?",
      [id]
    );

    const updatedUser = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[API] Error updating user:", error);
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

    const userIdFromToken = String(payload.userId || payload.id);
    const userIdFromPath = String(id);

    if (userIdFromPath !== userIdFromToken && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    conn = await getConnection();


    const [existingRows] = await conn.execute(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    await conn.execute("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("[API] Error deleting user:", error);
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

    const userIdFromToken = String(payload.userId || payload.id);
    const userIdFromPath = String(id);

    if (userIdFromPath !== userIdFromToken && payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    conn = await getConnection();

    const [rows] = await conn.execute(
      "SELECT password FROM users WHERE id = ?",
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = (rows as any[])[0];
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

 
    const hashedPassword = await bcrypt.hash(newPassword, 10);

 
    await conn.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("[API] Error changing password:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } finally {
    if (conn) conn.release();
  }
}
