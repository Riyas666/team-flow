
import { Router } from "express";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import uploadProfilePicture from '../middleware/upload.middleware.js'
import { uploadProfilePictureHandler } from '../controllers/user.controller.js'

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);
router.post(
  '/me/profile-picture',
  uploadProfilePicture.single('profilePicture'),
  uploadProfilePictureHandler,
)

export default router;
