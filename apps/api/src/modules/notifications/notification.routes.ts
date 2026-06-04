import { Router } from "express";
import { z } from "zod";
import { AuthenticatedRequest, requireAuth } from "../../middleware/auth";
import { registerPushToken } from "./notification.service";

const router = Router();

const registerSchema = z.object({
  token: z.string().min(20).max(512),
  platform: z.enum(["ios", "android", "web"]).optional()
});

router.post(
  "/register-token",
  requireAuth,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = registerSchema.parse(req.body);
      await registerPushToken({
        userId: req.user!.id,
        token: body.token,
        platform: body.platform
      });
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export const notificationRoutes = router;
