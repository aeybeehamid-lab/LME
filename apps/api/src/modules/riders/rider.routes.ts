import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../../middleware/auth";
import { createRider, listRiders, updateRider } from "./rider.service";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("executive", "ops_assistant"));

router.get("/", async (_req, res, next) => {
  try {
    const riders = await listRiders();
    res.json({ riders });
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  phone: z.string().min(10).max(20),
  name: z.string().min(1).max(120),
  bikeId: z.string().min(1).max(50).optional()
});

router.post("/", async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const rider = await createRider(body);
    res.status(201).json({ rider });
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  bikeId: z.string().min(1).max(50).nullable().optional(),
  isOnline: z.boolean().optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(120).nullable().optional()
});

router.patch("/:riderUserId", async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const rider = await updateRider({
      riderUserId: req.params.riderUserId,
      ...body
    });
    res.json({ rider });
  } catch (err) {
    next(err);
  }
});

export const riderRoutes = router;

