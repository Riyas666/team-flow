
import { Router } from "express";
import {
  createProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
  deleteProjectHandler
} from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  authorize("owner", "teamLeader"),
  createProjectHandler,
);

router.get("/", listProjectsHandler);

router.patch(
  "/:projectId",
  authorize("owner", "teamLeader"),
  updateProjectHandler,
);

router.delete(
  "/:projectId",
  authorize("owner", "teamLeader"),
  deleteProjectHandler,
);

export default router;
