import cors from "cors";
import express from "express";
import helmet from "helmet";
import { apiRouter } from "./routes";
import { paystackWebhookRouter } from "./modules/payments/payment.routes";
import { errorHandler } from "./middleware/errorHandler";

export const app = express();

app.use(helmet());
app.use(cors());
/** Webhooks must read raw body before JSON parser. */
app.use("/api/v1/webhooks", paystackWebhookRouter);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "lme-api",
    status: "ok",
    version: "0.1.0"
  });
});

app.use("/api/v1", apiRouter);

app.use(errorHandler);
