import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import nodemailer from "nodemailer";
import crypto from "crypto";


function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email обязателен" }, { status: 400 });
    }

  
    const conn = await getConnection();
    const [rows] = await conn.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    const users = rows as any[];
    if (users.length === 0) {
    
      return NextResponse.json(
        {
          message:
            "Если пользователь с таким email существует, инструкции по восстановлению будут отправлены",
          success: true,
        },
        { status: 200 }
      );
    }

    const user = users[0];

   
    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 3600000);

   
    await conn.execute(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [resetToken, resetTokenExpires, user.id]
    );

   
    const host = request.headers.get("host") || "";
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

   
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

   
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.mail.ru",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || "mirastom2023@mail.ru",
        pass: process.env.SMTP_PASS || "2dJujpjXUDyA0YXd9fwi",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || "mirastom2023@mail.ru",
      to: email,
      subject: "Восстановление пароля",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #3E4F5F; margin-bottom: 10px;">Восстановление пароля</h2>
            <p style="color: #666;">Вы запросили восстановление пароля для вашего аккаунта</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin-bottom: 20px;">Для восстановления пароля перейдите по ссылке ниже:</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #3E4F5F; color: white; 
                        text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Восстановить пароль
              </a>
            </div>
            <p style="color: #888; font-size: 14px; margin-top: 20px;">
              Или скопируйте ссылку в браузер:<br/>
              <a href="${resetUrl}" style="color: #3E4F5F; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin-bottom: 5px;">
              Ссылка действительна в течение 1 часа.
            </p>
            <p style="color: #999; font-size: 12px; margin-bottom: 5px;">
              Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.
            </p>
            <p style="color: #999; font-size: 12px;">
              С уважением,<br/>
              Команда приложения
            </p>
          </div>
        </div>
      `,
      text: `Для восстановления пароля перейдите по ссылке: ${resetUrl}\n\nСсылка действительна в течение 1 часа.\nЕсли вы не запрашивали восстановление пароля, проигнорируйте это письмо.`,
    };

 
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      {
        message: "Инструкции по восстановлению пароля отправлены на email",
        success: true,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Ошибка сервера: " + err.message },
      { status: 500 }
    );
  }
}


export async function GET() {
  return NextResponse.json(
    { error: "Метод не поддерживается" },
    { status: 405 }
  );
}
