
import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/authorize.middleware.js";
import uploadProfilePicture from "../middleware/upload.middleware.js";

import {
  getWorkspaceSettingsHandler,
  updateWorkspaceSettingsHandler,
  uploadCompanyLogoHandler,
} from "../controllers/company.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/settings", getWorkspaceSettingsHandler);

router.patch(
  "/settings",
  authorize("owner"),
  updateWorkspaceSettingsHandler,
);

router.post(
  "/settings/logo",
  authorize("owner"),
  uploadProfilePicture.single("logo"),
  uploadCompanyLogoHandler,
);

export default router;
