
import { Router } from "express";
import { listActivitiesHandler } from "../controllers/activity.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listActivitiesHandler);

export default router;
