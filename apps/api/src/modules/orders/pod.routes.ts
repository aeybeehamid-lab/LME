import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../../db";
import { AppError } from "../../middleware/errorHandler";
import { AuthenticatedRequest, requireAuth, requireRoles } from "../../middleware/auth";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads", "pod");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Only JPEG, PNG, or WebP images are accepted.", "INVALID_FILE_TYPE"));
    }
  }
});

router.post(
  "/:orderId/proof-of-delivery",
  requireAuth,
  requireRoles("rider"),
  upload.single("photo"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, "A photo is required for proof of delivery.", "MISSING_FILE");
      }

      const { orderId } = req.params;
      const riderId = req.user!.id;
      const podUrl = `/uploads/pod/${req.file.filename}`;

      const result = await pool.query(
        `SELECT id, status, rider_id FROM orders WHERE id = $1`,
        [orderId]
      );
      const order = result.rows[0];

      if (!order) throw new AppError(404, "Order not found.", "NOT_FOUND");
      if (order.rider_id !== riderId) throw new AppError(403, "This order is not assigned to you.", "FORBIDDEN");
      if (order.status !== "en_route") {
        throw new AppError(400, `Cannot upload POD — order is currently ${order.status}. Must be en_route.`, "INVALID_STATUS");
      }

      await pool.query(
        `UPDATE orders SET pod_url = $1, updated_at = NOW() WHERE id = $2`,
        [podUrl, orderId]
      );

      res.json({ ok: true, podUrl });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:orderId/proof-of-delivery", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const result = await pool.query(
      `SELECT pod_url FROM orders WHERE id = $1`,
      [req.params.orderId]
    );
    const order = result.rows[0];
    if (!order || !order.pod_url) {
      throw new AppError(404, "No proof of delivery found for this order.", "NOT_FOUND");
    }
    res.json({ podUrl: order.pod_url });
  } catch (err) {
    next(err);
  }
});

export const podRoutes = router;