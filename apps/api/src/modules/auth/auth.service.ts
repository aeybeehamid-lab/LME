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

export async function findOrCreateDevUser(
  phone: string,
  role: UserRole,
  name?: string
): Promise<AuthUser> {
  const existing = await pool.query<DbUser>(
    `SELECT id, phone, role, name FROM users WHERE phone = $1`,
    [phone]
  );

  if (existing.rows[0]) {
    return {
      id: existing.rows[0].id,
      phone: existing.rows[0].phone,
      role: existing.rows[0].role,
      name: existing.rows[0].name ?? undefined
    };
  }

  const inserted = await pool.query<DbUser>(
    `INSERT INTO users (phone, role, name)
     VALUES ($1, $2, $3)
     RETURNING id, phone, role, name`,
    [phone, role, name ?? null]
  );

  const user = inserted.rows[0];
  if (!user) {
    throw new AppError(500, "Failed to create user.");
  }

  return {
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name ?? undefined
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
