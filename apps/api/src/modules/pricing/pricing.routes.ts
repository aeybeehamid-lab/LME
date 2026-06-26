import { Router } from "express";
import { z } from "zod";
import {
  AuthenticatedRequest,
  requireAuth,
  requireRoles
} from "../../middleware/auth";
import {
  getPricingConfig,
  quoteDeliveryFee,
  updatePricingConfig
} from "./pricing.service";
import type { PricingConfig } from "@lme/types";

const router = Router();

const tierSchema = z.object({
  minKobo: z.number().int().nonnegative(),
  maxKobo: z.number().int().nonnegative()
});

const updateSchema = z.object({
  gadgets: z
    .object({
      phone: tierSchema.optional(),
      laptop: tierSchema.optional(),
      other: tierSchema.optional()
    })
    .optional(),
  grocery: z
    .object({
      baseKobo: z.number().int().nonnegative().optional(),
      percentBps: z.number().int().nonnegative().optional()
    })
    .optional(),
  food: z.object({ baseKobo: z.number().int().nonnegative().optional() }).optional(),
  laundry: z.object({ baseKobo: z.number().int().nonnegative().optional() }).optional(),
  other: z.object({ baseKobo: z.number().int().nonnegative().optional() }).optional(),
  urgent: z
    .object({
      minMultiplier: z.number().min(1).optional(),
      maxMultiplier: z.number().min(1).optional()
    })
    .optional()
});

const quoteSchema = z.object({
  category: z.enum(["gadgets", "food", "grocery", "laundry", "other"]),
  gadgetType: z.enum(["phone", "laptop", "other"]).optional(),
  orderValueKobo: z.number().int().nonnegative().optional(),
  urgent: z.boolean().optional()
});

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const pricing = await getPricingConfig();
    res.json({ pricing });
  } catch (err) {
    next(err);
  }
});

router.post("/quote", requireAuth, async (req, res, next) => {
  try {
    const body = quoteSchema.parse(req.body);
    const quote = await quoteDeliveryFee(body);
    res.json({
      deliveryFeeKobo: quote.deliveryFeeKobo,
      urgentMultiplier: quote.urgentMultiplier
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/",
  requireAuth,
  requireRoles("executive", "ops_assistant"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = updateSchema.parse(req.body);
      const pricing = await updatePricingConfig({
        patch: body as Partial<PricingConfig>,
        updatedBy: req.user!.id
      });
      res.json({ pricing });
    } catch (err) {
      next(err);
    }
  }
);

export const pricingRoutes = router;
