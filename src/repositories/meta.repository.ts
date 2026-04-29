import pool from "../config/db";
import { RowDataPacket } from "mysql2";
import { Brand, City } from "../types/db.types";

export class MetaRepository {
  static async getBrands(): Promise<Brand[]> {
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM brands ORDER BY name ASC");
    return rows as Brand[];
  }

  static async getCities(): Promise<City[]> {
    const [rows] = await pool.execute<RowDataPacket[]>("SELECT * FROM cities ORDER BY name ASC");
    return rows as City[];
  }
}
