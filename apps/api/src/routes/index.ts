import { podRoutes } from "../modules/orders/pod.routes";
import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { orderRoutes } from "../modules/orders/order.routes";
import { opsRoutes } from "../modules/ops/ops.routes";
import { paymentRoutes } from "../modules/payments/payment.routes";
import { riderRoutes } from "../modules/riders/rider.routes";
import { financeRoutes } from "../modules/finance/finance.routes";
import { notificationRoutes } from "../modules/notifications/notification.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/orders", podRoutes);
apiRouter.use("/ops", opsRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/riders", riderRoutes);
apiRouter.use("/finance", financeRoutes);
apiRouter.use("/notifications", notificationRoutes);
