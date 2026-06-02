import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth";
import { getOrderAutomationStatus } from "../../jobs/order-automation";

const router = Router();

router.get(
  "/automation-status",
  requireAuth,
  requireRoles("executive", "ops_assistant"),
  (_req, res) => {
    res.json({ automation: getOrderAutomationStatus() });
  }
);

export const opsRoutes = router;

