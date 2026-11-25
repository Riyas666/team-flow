
import { Router } from "express";
import {
  acceptInvitationHandler,
  createInvitationHandler,
} from "../controllers/invitation.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  authorize("owner"),
  createInvitationHandler,
);

router.post("/accept", acceptInvitationHandler);

export default router;
