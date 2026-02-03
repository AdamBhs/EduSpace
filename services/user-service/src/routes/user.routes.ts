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

const router = Router();

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
 * @route   PUT /api/users/me/email
 * @desc    Update user email
 * @access  Protected
 */
router.put(
  "/me/email",
  authenticate,
  validate(updateEmailSchema),
  UserController.updateEmail,
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

export default router;
