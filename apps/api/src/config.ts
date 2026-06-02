import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT ?? "4000");

if (Number.isNaN(port) || port <= 0) {
  throw new Error("Invalid PORT value in environment.");
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port,
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/lme",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  orderAutomationIntervalMs: Number(process.env.ORDER_AUTOMATION_INTERVAL_MS ?? "60000")
};
