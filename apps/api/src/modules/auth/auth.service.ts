import jwt from "jsonwebtoken";
import { AuthUser, UserRole } from "@lme/types";
import { pool } from "../../db";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";

interface DbUser {
  id: string;
  phone: string;
  role: UserRole;
  name: string | null;
}

interface DbRiderDirectoryUser {
  id: string;
  name: string | null;
  phone: string;
  bike_id: string | null;
  is_online: boolean;
}

export async function findOrCreateDevUser(
  phone: string,
  role: UserRole,
  name?: string
): Promise<AuthUser> {
  const existing = await pool.query<DbUser>(
    `SELECT id, phone, role, name FROM users WHERE phone = $1`,
    [phone]
  );

  let userRow: DbUser | undefined = existing.rows[0];

  if (userRow) {
    const shouldUpdateRole = userRow.role !== role;
    const shouldUpdateName = Boolean(name && name.trim().length > 0 && userRow.name !== name);

    if (shouldUpdateRole || shouldUpdateName) {
      const updated = await pool.query<DbUser>(
        `UPDATE users
         SET role = $2,
             name = COALESCE($3, name),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, phone, role, name`,
        [userRow.id, role, name ?? null]
      );
      userRow = updated.rows[0];
    }
  } else {
    const inserted = await pool.query<DbUser>(
      `INSERT INTO users (phone, role, name)
       VALUES ($1, $2, $3)
       RETURNING id, phone, role, name`,
      [phone, role, name ?? null]
    );
    userRow = inserted.rows[0];
  }

  if (!userRow) {
    throw new AppError(500, "Failed to create user.");
  }

  if (role === "rider") {
    await pool.query(
      `INSERT INTO riders (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [userRow.id]
    );
  }

  return {
    id: userRow.id,
    phone: userRow.phone,
    role: userRow.role,
    name: userRow.name ?? undefined
  };
}

export function signAccessToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const result = await pool.query<DbUser>(
    `SELECT id, phone, role, name FROM users WHERE id = $1 AND is_active = TRUE`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    role: row.role,
    name: row.name ?? undefined
  };
}

export async function listRiderDirectory() {
  const result = await pool.query<DbRiderDirectoryUser>(
    `SELECT u.id, u.name, u.phone, r.bike_id, r.is_online
     FROM users u
     INNER JOIN riders r ON r.user_id = u.id
     WHERE u.is_active = TRUE
     ORDER BY COALESCE(u.name, u.phone) ASC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name ?? "Unnamed rider",
    phone: row.phone,
    bikeId: row.bike_id ?? undefined,
    isOnline: row.is_online
  }));
}
