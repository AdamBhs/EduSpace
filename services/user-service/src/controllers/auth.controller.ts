// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import {
  hashPassword,
  comparePassword,
} from "../../../../shared/src/utils/password";
import { generateToken, verifyToken } from "../../../../shared/src/utils/jwt";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phoneNumber, timezone } =
        req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        sendError(res, "Email already registered", 409);
        return;
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user with profile in a transaction
      const user = await prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
          },
        });

        // Create profile
        await tx.user_profile.create({
          data: {
            user_id: newUser.userId,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber || null,
            timezone: timezone || "UTC",
          },
        });

        return newUser;
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.userId,
        email: user.email,
      });
      // TODO: CHANGE LETTER TO BE .env.FRONTEND_URL
      const activationLink = `${process.env.BACKEND_URL}/api/auth/activate/${token}`;

      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        to: user.email,
        subject: "Activate your account",
        html: `
          <h2>Welcome ${firstName}!</h2>
          <p>Click the link below to activate your account:</p>
          <a href="${activationLink}">Activate Account</a>
          <p>This link will expire in 24 hours.</p>
        `,
      });

      sendSuccess(
        res,
        {
          token,
          user: {
            userId: user.userId,
            email: user.email,
          },
        },
        "User registered successfully",
        201,
      );
    } catch (error) {
      console.error("Register error:", error);
      sendError(res, "Registration failed", 500);
    }
  }

  /**
   * Activate account
   * POST /api/auth/activate/:token
   */
  static async activate(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (typeof token !== "string") {
        sendError(res, "Invalid token", 400);
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };

      await prisma.user.update({
        where: { userId: decoded.userId },
        data: { isVerified: true },
      });

      res.redirect(`${process.env.FRONTEND_URL}/activation-success`);
    } catch (error) {
      console.error("Activate error:", error);
      sendError(res, "Activate failed", 500);
    }
  }
  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user with profile
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
        },
      });

      if (!user) {
        sendError(res, "Invalid credentials", 401);
        return;
      }

      // Check if account is active
      if (!user.isVerified) {
        sendError(res, "Account is not active", 403);
        return;
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        sendError(res, "Invalid credentials", 401);
        return;
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.userId,
        email: user.email,
      });

      sendSuccess(res, {
        message: "Login successful",
        token,
        user: {
          userId: user.userId,
          email: user.email,

          profile: user.profile
            ? {
                firstName: user.profile.first_name,
                lastName: user.profile.last_name,
                avatarUrl: user.profile.avatar_url,
                phoneNumber: user.profile.phone_number,
                timezone: user.profile.timezone,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      sendError(res, "Login failed", 500);
    }
  }

  /**
   * Verify JWT token (for other services)
   * GET /api/auth/verify
   */
  static async verify(req: Request, res: Response): Promise<void> {
    try {
      // User is already authenticated by auth middleware
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { userId },
        include: {
          profile: true,
        },
      });

      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      sendSuccess(res, {
        valid: true,
        user: {
          userId: user.userId,
          email: user.email,
          isVerified: user.isVerified,
          profile: user.profile
            ? {
                firstName: user.profile.first_name,
                lastName: user.profile.last_name,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Verify error:", error);
      sendError(res, "Verification failed", 500);
    }
  }

  /**
   * Request password reset
   * POST /api/auth/request-reset
   */
  static async requestPasswordReset(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { email } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Don't reveal if user exists (security)
      if (!user) {
        sendSuccess(res, {
          message: "A password reset link has been sent",
        });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Save reset token (expires in 1 hour)
      await prisma.password_reset.create({
        data: {
          user_id: user.userId,
          reset_token_hash: resetTokenHash,
          expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // TODO: Send email with reset token
      // For now, return token (remove in production!)
      console.log("Reset Token:", resetToken);

      sendSuccess(res, {
        message: "A password reset link has been sent",
        // Remove in production:
        resetToken:
          process.env.NODE_ENV === "development" ? resetToken : undefined,
      });
    } catch (error) {
      console.error("Request reset error:", error);
      sendError(res, "Password reset request failed", 500);
    }
  }

  /**
   * Reset password with token
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;

      // Hash the token to compare with database
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Find valid reset token
      const passwordReset = await prisma.password_reset.findUnique({
        where: { reset_token_hash: resetTokenHash },
        include: { user: true },
      });

      if (!passwordReset) {
        sendError(res, "Invalid or expired reset token", 400);
        return;
      }

      // Check if token is expired
      if (passwordReset.expires_at < new Date()) {
        sendError(res, "Reset token has expired", 400);
        return;
      }

      // Check if token was already used
      if (passwordReset.used_at) {
        sendError(res, "Reset token has already been used", 400);
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and mark token as used in a transaction
      await prisma.$transaction([
        prisma.user.update({
          where: { userId: passwordReset.user_id },
          data: { password: hashedPassword },
        }),
        prisma.password_reset.update({
          where: { id: passwordReset.id },
          data: { used_at: new Date() },
        }),
      ]);

      sendSuccess(res, {
        message: "Password reset successful",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      sendError(res, "Password reset failed", 500);
    }
  }

  /**
   * Logout (optional - mainly client-side token removal)
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // In JWT-based auth, logout is mainly client-side
      // But we can add token to blacklist if needed

      sendSuccess(res, {
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      sendError(res, "Logout failed", 500);
    }
  }
}
