
import { Router } from "express";
import { dashboardSummaryHandler } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", dashboardSummaryHandler);

export default router;
