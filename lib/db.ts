import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";


const certPath = path.join(process.cwd(), "certs", "isrgrootx1.pem");

let sslConfig;
try {
  sslConfig = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(certPath),
  };
  console.log("✅ SSL сертификат загружен");
} catch (error) {
  console.warn("⚠️ Сертификат не найден, используем стандартную проверку", error);
  sslConfig = {
    rejectUnauthorized: true, 
  };
}
const pool = mysql.createPool({
  host: process.env.NEXT_PUBLIC_HOST,
  port: process.env.NEXT_PUBLIC_PORT
    ? parseInt(process.env.NEXT_PUBLIC_PORT)
    : 4000,
  user: process.env.NEXT_PUBLIC_DATABASE_USER,
  password: process.env.NEXT_PUBLIC_PASSWORD,
  database: process.env.NEXT_PUBLIC_DATABASE_NAME,
  ssl: sslConfig, //ssl: { rejectUnauthorized: false },
  connectTimeout: 20000,
});

export async function getConnection() {
  return pool.getConnection();
}
