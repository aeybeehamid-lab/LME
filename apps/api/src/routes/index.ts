import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { orderRoutes } from "../modules/orders/order.routes";
import { opsRoutes } from "../modules/ops/ops.routes";
import { paymentRoutes } from "../modules/payments/payment.routes";
import { riderRoutes } from "../modules/riders/rider.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/ops", opsRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/riders", riderRoutes);
