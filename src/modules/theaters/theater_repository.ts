import { pool } from "../../db/pool.js";
import { type TheatreRow } from "./theater_types.js";

export async function findAllTheaters(): Promise<TheatreRow[]> {
    const res = await pool.query<TheatreRow>(
        `SELECT id, name, city FROM theaters ORDER BY id`
    )
    return res.rows;
}
