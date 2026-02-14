import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { uploadFile } from "../controllers/file.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * @route   POST /api/auth/upload
 * @desc    Upload avatar image
 * @access  Protected
 */
router.post("/upload", authenticate, upload.single("file"), uploadFile);

export default router;
