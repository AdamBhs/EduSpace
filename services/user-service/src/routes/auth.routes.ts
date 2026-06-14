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
  validationCodeSchema,
  resendCodeSchema,
  changePasswordSchema,
} from "../../../../shared/src/utils/validationSchemas";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validate(registerSchema), AuthController.register);

/**
 * @route   POST /api/auth/verifyCode
 * @desc    send a verification code
 * @access  Public
 */
router.post(
  "/verifyCode",
  validate(validationCodeSchema),
  AuthController.verifyCode,
);

/**
 * @route   POST /api/auth/resendCode
 * @desc    Resend a verification code
 * @access  Public
 */
router.post("/resendCode", validate(resendCodeSchema), AuthController.resendCode);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", validate(loginSchema), AuthController.login);

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
 * @route   POST /api/auth/change-password
 * @desc    Change password (authenticated)
 * @access  Protected
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword,
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post("/logout", authenticate, AuthController.logout);

export default router;
