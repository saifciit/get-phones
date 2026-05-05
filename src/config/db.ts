import mysql from 'mysql2/promise';
import env from './env';

const pool = mysql.createPool({
  host:               env.DB_HOST,
  port:               env.DB_PORT,
  user:               env.DB_USER,
  password:           env.DB_PASSWORD,
  database:           env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           '+00:00',
  dateStrings:        false,
});

export default pool;

/** Convenience helper — returns rows typed as T[] */
export async function query<T = any>(sql: string, values?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, values);
  return rows as T[];
}

/** Returns the first row or null */
export async function queryOne<T = any>(sql: string, values?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] ?? null;
}

/** For INSERT / UPDATE / DELETE — returns ResultSetHeader */
export async function execute(sql: string, values?: any[]) {
  const [result] = await pool.execute(sql, values);
  return result as mysql.ResultSetHeader;
}
