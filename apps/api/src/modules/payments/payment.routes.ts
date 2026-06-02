import { Router } from "express";
import express from "express";
import { z } from "zod";
import {
  handlePaystackWebhook,
  initializePayment,
  verifyPaystackSignature
} from "./payment.service";
import { requireAuth, requireRoles } from "../../middleware/auth";

const router = Router();

const initSchema = z.object({
  orderId: z.string().uuid(),
  amountKobo: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(120)
});

router.post(
  "/initialize",
  requireAuth,
  requireRoles("customer", "executive"),
  async (req, res, next) => {
    try {
      const body = initSchema.parse(req.body);
      const payment = await initializePayment(body);
      res.status(201).json({ payment });
    } catch (err) {
      next(err);
    }
  }
);

/** Paystack sends raw JSON; signature verified against raw body. */
export const paystackWebhookRouter = Router();
paystackWebhookRouter.post(
  "/paystack",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const signature = req.headers["x-paystack-signature"] as string | undefined;
      const rawBody = req.body as Buffer;

      if (!verifyPaystackSignature(rawBody, signature)) {
        res.status(401).json({ error: "Invalid webhook signature." });
        return;
      }

      const payload = JSON.parse(rawBody.toString("utf8"));
      const event = payload?.event as string;
      const data = payload?.data;
      const reference = data?.reference as string;
      const status = data?.status === "success" ? "success" : "failed";

      if (!reference || event !== "charge.success") {
        res.status(200).json({ received: true, ignored: true });
        return;
      }

      await handlePaystackWebhook({
        reference,
        status,
        idempotencyKey: `webhook:${reference}`
      });

      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

export const paymentRoutes = router;
