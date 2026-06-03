import { Router } from "express";
import { requireAuth, requireRoles } from "../../middleware/auth";
import {
  getFinanceSummary,
  getRiderStats,
  listRecentTransactions
} from "./finance.service";

const router = Router();

router.use(requireAuth);
router.use(requireRoles("executive", "ops_assistant"));

router.get("/summary", async (_req, res, next) => {
  try {
    const summary = await getFinanceSummary();
    res.json({ summary });
  } catch (err) {
    next(err);
  }
});

router.get("/transactions", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const transactions = await listRecentTransactions(limit);
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
});

router.get("/riders/:riderUserId/stats", async (req, res, next) => {
  try {
    const stats = await getRiderStats(req.params.riderUserId);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

export const financeRoutes = router;
