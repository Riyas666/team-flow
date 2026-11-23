
import { Router } from "express";
import { listMembersHandler,
         deleteMemberHandler,
         updateMemberStatusHandler
 } from "../controllers/member.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js"

const router = Router();

router.use(requireAuth);

router.get("/", listMembersHandler);

router.delete(
  "/:memberId",
  authorize("owner", "teamLeader"),
  deleteMemberHandler,
);

router.patch(
  "/:memberId/status",
  authorize("owner", "teamLeader"),
  updateMemberStatusHandler,
);
export default router;
