
import { Router } from "express";
import {
  createTaskHandler,
  listTasksHandler,
  updateTaskStatusHandler,
  deleteTaskHandler,
  updateTaskHandler
} from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listTasksHandler);

router.post(
  "/",
  authorize("owner", "teamLeader"),
  createTaskHandler,
);
router.patch(
  "/:taskId",
  authorize("owner", "teamLeader"),
  updateTaskHandler
);

router.patch("/:taskId/status", updateTaskStatusHandler);

router.delete(
  "/:taskId",
  authorize("owner", "teamLeader"),
  deleteTaskHandler,
);

export default router;
