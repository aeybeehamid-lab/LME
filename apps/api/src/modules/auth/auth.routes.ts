import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@lme/types";
import {
  findOrCreateDevUser,
  findOrCreateFirebaseUser,
  getUserById,
  listRiderDirectory,
  signAccessToken
} from "./auth.service";
import { verifyFirebaseIdToken, isFirebaseConfigured } from "./firebase.service";
import { requireAuth, AuthenticatedRequest } from "../../middleware/auth";
import { requireRoles } from "../../middleware/auth";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";

const router = Router();

const devLoginSchema = z.object({
  phone: z.string().min(10).max(20),
  role: z.enum(["customer", "rider", "executive", "ops_assistant"]),
  name: z.string().min(1).max(120).optional()
});

const firebaseLoginSchema = z.object({
  idToken: z.string().min(20),
  role: z.enum(["customer", "rider", "executive", "ops_assistant"]).optional()
});

/** Exchange Firebase phone OTP idToken for LME JWT. */
router.post("/firebase", async (req, res, next) => {
  try {
    if (!isFirebaseConfigured()) {
      throw new AppError(503, "Firebase is not configured.", "FIREBASE_UNAVAILABLE");
    }

    const body = firebaseLoginSchema.parse(req.body);
    const { firebaseUid, phone } = await verifyFirebaseIdToken(body.idToken);
    const role = body.role ?? "customer";

    const user = await findOrCreateFirebaseUser({
      firebaseUid,
      phone,
      role: role as UserRole,
      name: undefined
    });
    const token = signAccessToken(user);

    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

/** Dev-only login until Firebase OTP is integrated. Disabled in production. */
router.post("/dev-login", async (req, res, next) => {
  try {
    if (config.env === "production") {
      throw new AppError(403, "Dev login is disabled in production.", "FORBIDDEN");
    }

    const body = devLoginSchema.parse(req.body);
    const user = await findOrCreateDevUser(
      body.phone,
      body.role as UserRole,
      body.name
    );
    const token = signAccessToken(user);

    res.json({ user, token });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      throw new AppError(404, "User not found.", "NOT_FOUND");
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/riders",
  requireAuth,
  requireRoles("executive", "ops_assistant"),
  async (_req, res, next) => {
    try {
      const riders = await listRiderDirectory();
      res.json({ riders });
    } catch (err) {
      next(err);
    }
  }
);

export const authRoutes = router;
