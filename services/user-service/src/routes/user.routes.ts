// src/routes/user.routes.ts
import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  updateProfileSchema,
  updateEmailSchema,
  batchUsersSchema,
} from "../../../../shared/src/utils/validationSchemas";
import multer from "multer";
import { uploadAvatar } from "../controllers/uploadAvatar.controller";

const router = Router();
const upload = multer(); // memory storage

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get("/me", authenticate, UserController.getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update user profile
 * @access  Protected
 */
router.put(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  UserController.updateProfile,
);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account
 * @access  Protected
 */
router.delete("/me", authenticate, UserController.deleteAccount);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID (for other services)
 * @access  Protected
 */
router.get("/:userId", authenticate, UserController.getUserById);

/**
 * @route   POST /api/users/batch
 * @desc    Get multiple users by IDs (for other services)
 * @access  Protected
 */
router.post(
  "/batch",
  authenticate,
  validate(batchUsersSchema),
  UserController.getUsersByIds,
);

/**
 * @route   PUT /api/users/upload_avatar
 * @desc    Update avatar picture url
 * @access  Protected
 */
router.post("/upload_avatar", authenticate, upload.single("file"), uploadAvatar);

export default router;
