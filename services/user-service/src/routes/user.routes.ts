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
 * @route   GET /api/user/me
 * @desc    Get current user profile
 * @access  Protected
 */
router.get("/me",  UserController.getProfile);

/**
 * @route   PUT /api/user/me
 * @desc    Update user profile
 * @access  Protected
 */
router.put(
  "/me",
  
  validate(updateProfileSchema),
  UserController.updateProfile,
);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account
 * @access  Protected
 */
router.delete("/me",  UserController.deleteAccount);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID (for other services)
 * @access  Protected
 */
router.get("/:userId",  UserController.getUserById);

/**
 * @route   POST /api/user/getUsers
 * @desc    Get All users
 * @access  Protected
 */
router.get("/getUsers",  UserController.getUsers);

/**
 * @route   POST /api/user/batch
 * @desc    Get multiple users by IDs (for other services)
 * @access  Protected
 */
router.post(
  "/batch",
  
  validate(batchUsersSchema),
  UserController.getUsersByIds,
);

/**
 * @route   PUT /api/user/upload_avatar
 * @desc    Update avatar picture url
 * @access  Protected
 */
router.put(
  "/upload_avatar",
  
  upload.single("file"),
  UserController.uploadAvatar,
);

export default router;
