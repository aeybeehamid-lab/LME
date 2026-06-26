import { Router } from "express";
import { z } from "zod";
import {
  createOrder,
  getOrderEvents,
  getOrderById,
  listOpenJobBoardOrders,
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
  gadgetType: z.enum(["phone", "laptop", "other"]).optional(),
  orderValueKobo: z.number().int().nonnegative().optional(),
  urgent: z.boolean().optional(),
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
    const role = req.user!.role;
    const isStaff = role === "executive" || role === "ops_assistant";

    const order = await createOrder({
      customerId: req.user!.id,
      category: body.category,
      deliveryFeeKobo: body.deliveryFeeKobo,
      urgentMultiplier: body.urgentMultiplier,
      pickupAddress: body.pickupAddress,
      dropoffAddress: body.dropoffAddress,
      itemDescription: body.itemDescription,
      skipFeeValidation: isStaff,
      pricingInput: isStaff
        ? undefined
        : {
            gadgetType: body.gadgetType,
            orderValueKobo: body.orderValueKobo,
            urgent: body.urgent
          }
    });
    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/open-jobs",
  requireRoles("rider"),
  async (_req, res, next) => {
    try {
      const orders = await listOpenJobBoardOrders();
      res.json({ orders });
    } catch (err) {
      next(err);
    }
  }
);

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

router.get("/:orderId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const order = await getOrderById(req.params.orderId);
    const role = req.user?.role;
    if (role === "customer" && order.customerId !== req.user!.id) {
      res.status(403).json({ error: { message: "Forbidden." } });
      return;
    }
    if (role === "rider" && order.riderId && order.riderId !== req.user!.id) {
      const open = order.status === "posted_to_job_board";
      if (!open) {
        res.status(403).json({ error: { message: "Forbidden." } });
        return;
      }
    }
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
        actorRole: req.user!.role,
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
