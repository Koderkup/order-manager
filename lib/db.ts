import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.NEXT_PUBLIC_HOST,
  port: process.env.NEXT_PUBLIC_PORT
    ? parseInt(process.env.NEXT_PUBLIC_PORT)
    : 3306,
  user: process.env.NEXT_PUBLIC_DATABASE_USER,
  password: process.env.NEXT_PUBLIC_PASSWORD,
  database: process.env.NEXT_PUBLIC_DATABASE_NAME,
  ssl: { rejectUnauthorized: false },
  connectTimeout: 20000,
});

export async function getConnection() {
  return pool.getConnection();
}
