import { findAllTheaters } from "./theater_repository.js";
import type { TheaterDto } from "./theater_types.js";

export async function getAllTheaters(): Promise<TheaterDto[]>{
    const rows = await findAllTheaters();
    return rows.map((row) => ({
        id: String(row.id),
        name: row.name,
        city: row.city,
    }))
}