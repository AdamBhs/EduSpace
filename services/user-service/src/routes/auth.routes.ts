// src/routes/auth.routes.ts
import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from "../../../../shared/src/utils/validationSchemas";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validate(registerSchema), AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validate(loginSchema), AuthController.login);

/**
 * @route   Get /api/auth/activate/:token
 * @desc    Activate account
 * @access  Public
 */
router.get("/activate/:token", AuthController.activate);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token (for other services)
 * @access  Protected
 */
router.get("/verify", authenticate, AuthController.verify);

/**
 * @route   POST /api/auth/request-reset
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  "/request-reset",
  validate(requestPasswordResetSchema),
  AuthController.requestPasswordReset,
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword,
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post("/logout", authenticate, AuthController.logout);

export default router;
