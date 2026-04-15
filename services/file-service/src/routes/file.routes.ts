import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { FileController } from "../controllers/file.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @route   Get /api/auth/avatar_url/getProfilePic
 * @desc    Get avatar_url
 * @access  Protected
 */

router.get("/getProfilePic", authenticate, FileController.getAvatarUrl);

/**
 * @route   POST /api/auth/avatar_url/upload
 * @desc    Upload avatar image
 * @access  Protected
 */
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  FileController.uploadFile,
);

export default router;
