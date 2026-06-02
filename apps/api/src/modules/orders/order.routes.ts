import { Router } from "express";
import { z } from "zod";
import {
  createOrder,
  getOrderEvents,
  getOrderById,
  listOrders,
  transitionOrderStatus
} from "./order.service";
import {
  AuthenticatedRequest,
  requireAuth,
  requireRoles
} from "../../middleware/auth";

const router = Router();

const createOrderSchema = z.object({
  category: z.enum(["gadgets", "food", "grocery", "laundry", "other"]),
  deliveryFeeKobo: z.number().int().positive(),
  urgentMultiplier: z.number().min(1).max(2).optional(),
  pickupAddress: z.string().min(3),
  dropoffAddress: z.string().min(3),
  itemDescription: z.string().optional()
});

const transitionSchema = z.object({
  toStatus: z.enum([
    "payment_pending",
    "payment_confirmed",
    "posted_to_job_board",
    "rider_assigned",
    "picked_up",
    "en_route",
    "delivered",
    "escalated",
    "cancelled",
    "refunded"
  ]),
  riderId: z.string().uuid().optional(),
  reason: z.string().optional()
});

router.use(requireAuth);

router.post("/", requireRoles("customer", "executive", "ops_assistant"), async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    const order = await createOrder({
      customerId: req.user!.id,
      ...body
    });
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const role = req.user!.role;
    const filters: Parameters<typeof listOrders>[0] = {};

    if (req.query.status) {
      filters.status = req.query.status as never;
    }

    if (role === "customer") {
      filters.customerId = req.user!.id;
    } else if (role === "rider") {
      filters.riderId = req.user!.id;
    }

    const orders = await listOrders(filters);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.get("/:orderId", async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.orderId);
    res.json({ order });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/:orderId/events",
  requireRoles("executive", "ops_assistant"),
  async (req, res, next) => {
    try {
      const events = await getOrderEvents(req.params.orderId);
      res.json({ events });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:orderId/status",
  requireRoles("rider", "executive", "ops_assistant"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const body = transitionSchema.parse(req.body);
      const order = await transitionOrderStatus({
        orderId: req.params.orderId,
        toStatus: body.toStatus,
        actorUserId: req.user!.id,
        riderId: body.riderId ?? (req.user!.role === "rider" ? req.user!.id : undefined),
        reason: body.reason
      });
      res.json({ order });
    } catch (err) {
      next(err);
    }
  }
);

export const orderRoutes = router;
