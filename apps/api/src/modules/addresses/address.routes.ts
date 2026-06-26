import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db";
import { AppError } from "../../middleware/errorHandler";
import {
  AuthenticatedRequest,
  requireAuth,
  requireRoles
} from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  label: z.string().min(1).max(80),
  address: z.string().min(3).max(300)
});

router.get(
  "/",
  requireRoles("customer"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await pool.query(
        `SELECT id, label, address, created_at
         FROM saved_addresses
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [req.user!.id]
      );
      res.json({ addresses: result.rows });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requireRoles("customer"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = createSchema.parse(req.body);

      const count = await pool.query(
        `SELECT COUNT(*) FROM saved_addresses WHERE user_id = $1`,
        [req.user!.id]
      );
      if (parseInt(count.rows[0].count) >= 10) {
        throw new AppError(
          400,
          "You can save up to 10 addresses. Delete one to add more.",
          "LIMIT_EXCEEDED"
        );
      }

      const result = await pool.query(
        `INSERT INTO saved_addresses (user_id, label, address)
         VALUES ($1, $2, $3)
         RETURNING id, label, address, created_at`,
        [req.user!.id, body.label, body.address]
      );
      res.status(201).json({ address: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:addressId",
  requireRoles("customer"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await pool.query(
        `DELETE FROM saved_addresses
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [req.params.addressId, req.user!.id]
      );
      if (!result.rows[0]) {
        throw new AppError(404, "Address not found.", "NOT_FOUND");
      }
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export const addressRoutes = router;