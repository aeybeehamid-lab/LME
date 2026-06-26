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
  orderId: z.string().uuid(),
  subject: z.string().min(3).max(120),
  description: z.string().min(10).max(1000)
});

const resolveSchema = z.object({
  resolutionNote: z.string().min(3).max(500)
});

router.post(
  "/",
  requireRoles("customer"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = createSchema.parse(req.body);
      const customerId = req.user!.id;
      const orderResult = await pool.query(
        `SELECT id, customer_id FROM orders WHERE id = $1`,
        [body.orderId]
      );
      const order = orderResult.rows[0];
      if (!order) throw new AppError(404, "Order not found.", "NOT_FOUND");
      if (order.customer_id !== customerId) {
        throw new AppError(403, "This order does not belong to you.", "FORBIDDEN");
      }
      const result = await pool.query(
        `INSERT INTO complaints (order_id, customer_id, subject, description)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [body.orderId, customerId, body.subject, body.description]
      );
      res.status(201).json({ complaint: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/mine",
  requireRoles("customer"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await pool.query(
        `SELECT c.*, o.category, o.status AS order_status
         FROM complaints c
         JOIN orders o ON o.id = c.order_id
         WHERE c.customer_id = $1
         ORDER BY c.created_at DESC`,
        [req.user!.id]
      );
      res.json({ complaints: result.rows });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/",
  requireRoles("executive", "ops_assistant"),
  async (req, res, next) => {
    try {
      const status = req.query.status as string | undefined;
      const params: string[] = [];
      let where = "";
      if (status && ["open", "in_review", "resolved"].includes(status)) {
        params.push(status);
        where = `WHERE c.status = $${params.length}`;
      }
      const result = await pool.query(
        `SELECT c.*, o.category, o.status AS order_status, u.name AS customer_name
         FROM complaints c
         JOIN orders o ON o.id = c.order_id
         JOIN users u ON u.id = c.customer_id
         ${where}
         ORDER BY c.created_at DESC`,
        params
      );
      res.json({ complaints: result.rows });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:complaintId/resolve",
  requireRoles("executive", "ops_assistant"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = resolveSchema.parse(req.body);
      const result = await pool.query(
        `UPDATE complaints
         SET status = 'resolved', resolution_note = $1,
             resolved_by = $2, resolved_at = NOW(), updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [body.resolutionNote, req.user!.id, req.params.complaintId]
      );
      if (!result.rows[0]) throw new AppError(404, "Complaint not found.", "NOT_FOUND");
      res.json({ complaint: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:complaintId/review",
  requireRoles("executive", "ops_assistant"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await pool.query(
        `UPDATE complaints SET status = 'in_review', updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [req.params.complaintId]
      );
      if (!result.rows[0]) throw new AppError(404, "Complaint not found.", "NOT_FOUND");
      res.json({ complaint: result.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

export const complaintRoutes = router;