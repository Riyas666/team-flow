
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";

import {
  listMembersHandler,
  deleteMemberHandler,
  updateMemberStatusHandler,
  updateMemberRoleHandler,
} from "../controllers/member.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listMembersHandler);

router.delete(
  "/:memberId",
  authorize("owner"),
  deleteMemberHandler,
);

router.patch(
  "/:memberId/status",
  authorize("owner"),
  updateMemberStatusHandler,
);

router.patch(
  "/:memberId/role",
  authorize("owner"),
  updateMemberRoleHandler,
);

export default router;
