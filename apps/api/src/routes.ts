import { Router } from "express";
import { addressRoutes } from "./modules/addresses/address.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { orderRoutes } from "./modules/orders/order.routes";
import { podRoutes } from "./modules/orders/pod.routes";
import { opsRoutes } from "./modules/ops/ops.routes";
import { paymentRoutes } from "./modules/payments/payment.routes";
import { riderRoutes } from "./modules/riders/rider.routes";
import { financeRoutes } from "./modules/finance/finance.routes";
import { notificationRoutes } from "./modules/notifications/notification.routes";
import { complaintRoutes } from "./modules/complaints/complaint.routes";
import { pricingRoutes } from "./modules/pricing/pricing.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/orders", podRoutes);
apiRouter.use("/ops", opsRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/riders", riderRoutes);
apiRouter.use("/finance", financeRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/complaints", complaintRoutes);
apiRouter.use("/pricing", pricingRoutes);
apiRouter.use("/addresses", addressRoutes);