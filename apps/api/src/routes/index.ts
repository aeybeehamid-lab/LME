import { Router } from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { orderRoutes } from "../modules/orders/order.routes";
import { paymentRoutes } from "../modules/payments/payment.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/payments", paymentRoutes);
