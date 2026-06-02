import { pool } from "../../db";
import { AppError } from "../../middleware/errorHandler";

interface DbRiderRow {
  user_id: string;
  phone: string;
  name: string | null;
  is_active: boolean;
  bike_id: string | null;
  is_online: boolean;
  join_date: Date;
  strike_count: number;
}

function mapRider(row: DbRiderRow) {
  return {
    id: row.user_id,
    phone: row.phone,
    name: row.name ?? "Unnamed rider",
    isActive: row.is_active,
    bikeId: row.bike_id ?? undefined,
    isOnline: row.is_online,
    joinDate: row.join_date.toISOString().slice(0, 10),
    strikeCount: row.strike_count
  };
}

export async function listRiders() {
  const result = await pool.query<DbRiderRow>(
    `SELECT
       u.id as user_id,
       u.phone,
       u.name,
       u.is_active,
       r.bike_id,
       r.is_online,
       r.join_date,
       r.strike_count
     FROM users u
     INNER JOIN riders r ON r.user_id = u.id
     ORDER BY COALESCE(u.name, u.phone) ASC`
  );
  return result.rows.map(mapRider);
}

export async function createRider(input: {
  phone: string;
  name: string;
  bikeId?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<{ id: string }>(
      `SELECT id FROM users WHERE phone = $1`,
      [input.phone]
    );
    if (existing.rows[0]) {
      throw new AppError(409, "A user with this phone already exists.", "CONFLICT");
    }

    const userRes = await client.query<{ id: string; phone: string; name: string | null }>(
      `INSERT INTO users (phone, role, name)
       VALUES ($1, 'rider', $2)
       RETURNING id, phone, name`,
      [input.phone, input.name]
    );
    const user = userRes.rows[0];
    if (!user) throw new AppError(500, "Failed to create rider user.");

    await client.query(
      `INSERT INTO riders (user_id, bike_id, is_online)
       VALUES ($1, $2, FALSE)`,
      [user.id, input.bikeId ?? null]
    );

    await client.query("COMMIT");

    const rider = await client.query<DbRiderRow>(
      `SELECT
         u.id as user_id,
         u.phone,
         u.name,
         u.is_active,
         r.bike_id,
         r.is_online,
         r.join_date,
         r.strike_count
       FROM users u
       INNER JOIN riders r ON r.user_id = u.id
       WHERE u.id = $1`,
      [user.id]
    );
    const row = rider.rows[0];
    if (!row) throw new AppError(500, "Failed to fetch created rider.");
    return mapRider(row);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function updateRider(input: {
  riderUserId: string;
  bikeId?: string | null;
  isOnline?: boolean;
  isActive?: boolean;
  name?: string | null;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const exists = await client.query<{ id: string }>(
      `SELECT u.id
       FROM users u
       INNER JOIN riders r ON r.user_id = u.id
       WHERE u.id = $1`,
      [input.riderUserId]
    );
    if (!exists.rows[0]) {
      throw new AppError(404, "Rider not found.", "NOT_FOUND");
    }

    if (typeof input.isActive === "boolean" || typeof input.name !== "undefined") {
      await client.query(
        `UPDATE users
         SET is_active = COALESCE($2, is_active),
             name = COALESCE($3, name),
             updated_at = NOW()
         WHERE id = $1`,
        [input.riderUserId, input.isActive ?? null, input.name ?? null]
      );
    }

    if (typeof input.isOnline === "boolean" || typeof input.bikeId !== "undefined") {
      await client.query(
        `UPDATE riders
         SET is_online = COALESCE($2, is_online),
             bike_id = COALESCE($3, bike_id)
         WHERE user_id = $1`,
        [
          input.riderUserId,
          typeof input.isOnline === "boolean" ? input.isOnline : null,
          typeof input.bikeId === "undefined" ? null : input.bikeId
        ]
      );
    }

    await client.query("COMMIT");

    const updated = await pool.query<DbRiderRow>(
      `SELECT
         u.id as user_id,
         u.phone,
         u.name,
         u.is_active,
         r.bike_id,
         r.is_online,
         r.join_date,
         r.strike_count
       FROM users u
       INNER JOIN riders r ON r.user_id = u.id
       WHERE u.id = $1`,
      [input.riderUserId]
    );
    const row = updated.rows[0];
    if (!row) throw new AppError(500, "Failed to fetch updated rider.");
    return mapRider(row);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

