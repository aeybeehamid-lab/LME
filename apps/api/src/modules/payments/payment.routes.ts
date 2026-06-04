import { Router } from "express";
import express from "express";
import { z } from "zod";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";
import {
  devConfirmPayment,
  handlePaystackWebhook,
  initializePayment,
  verifyPaymentForOrder,
  verifyPaystackSignature
} from "./payment.service";
import {
  AuthenticatedRequest,
  requireAuth,
  requireRoles
} from "../../middleware/auth";

const router = Router();

const initSchema = z.object({
  orderId: z.string().uuid(),
  amountKobo: z.number().int().positive(),
  idempotencyKey: z.string().min(8).max(120)
});

router.post(
  "/initialize",
  requireAuth,
  requireRoles("customer", "executive", "ops_assistant"),
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

const verifySchema = z.object({
  orderId: z.string().uuid()
});

router.post(
  "/verify",
  requireAuth,
  requireRoles("customer", "executive", "ops_assistant"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = verifySchema.parse(req.body);
      const result = await verifyPaymentForOrder({
        orderId: body.orderId,
        userId: req.user!.id,
        userRole: req.user!.role
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

const devConfirmSchema = z.object({
  orderId: z.string().uuid()
});

const devConfirmRoles =
  config.env === "production"
    ? (["executive", "ops_assistant"] as const)
    : (["customer", "executive", "ops_assistant"] as const);

router.post(
  "/dev-confirm",
  requireAuth,
  requireRoles(...devConfirmRoles),
  async (req, res, next) => {
    try {
      if (config.env === "production") {
        throw new AppError(403, "Dev payment confirm is disabled in production.", "FORBIDDEN");
      }
      const body = devConfirmSchema.parse(req.body);
      const result = await devConfirmPayment(body.orderId);
      res.json({ ok: true, ...result });
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
