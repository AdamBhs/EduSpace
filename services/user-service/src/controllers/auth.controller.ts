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
   * resend code
   * POST /api/auth/resendCode
   */
  static async resendCode(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      if (user.isVerified) {
        sendError(res, "Account already verified", 400);
        return;
      }

      // Rate limit — prevent spamming resend
      const cooldown = 60 * 1000; // 1 minute
      if (user.codeExpiresAt) {
        const timeElapsed =
          Date.now() - (user.codeExpiresAt.getTime() - 5 * 60 * 1000);
        if (timeElapsed < cooldown) {
          const secondsLeft = Math.ceil((cooldown - timeElapsed) / 1000);
          sendError(
            res,
            `Please wait ${secondsLeft} seconds before requesting a new code`,
            429,
          );
          return;
        }
      }

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const codeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.user.update({
        where: { email },
        data: { verificationCode, codeExpiresAt },
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const firstName = user.profile?.first_name || "there";

      await transporter.sendMail({
        to: email,
        subject: "Your new verification code",
        html: `
        <h2>Hi ${firstName}!</h2>
        <p>Your new verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #137FEC;">${verificationCode}</h1>
        <p>This code expires in <strong>5 minutes</strong>.</p>
      `,
      });

      sendSuccess(res, null, "Verification code resent successfully");
    } catch (error) {
      console.error("Resend code error:", error);
      sendError(res, "Failed to resend code", 500);
    }
  }

  /**
   * Verifiy code
   * POST /api/auth/verifyCode
   */
  static async verifyCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      if (user.isVerified) {
        sendError(res, "Account already verified", 400);
        return;
      }

      if (user.verificationCode !== code) {
        sendError(res, "Invalid verification code", 400);
        return;
      }

      if (!user.codeExpiresAt || new Date() > user.codeExpiresAt) {
        sendError(res, "Verification code has expired", 400);
        return;
      }

      await prisma.user.update({
        where: { email },
        data: {
          isVerified: true,
          verificationCode: null,
          codeExpiresAt: null,
        },
      });

      const token = generateToken({ userId: user.userId, email: user.email });

      sendSuccess(
        res,
        { token, user: { userId: user.userId, email: user.email } },
        "Account verified successfully",
      );
    } catch (error) {
      console.error("Verify error:", error);
      sendError(res, "Verification failed", 500);
    }
  }

  /**
   * Register a new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, phoneNumber, timezone } =
        req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        sendError(res, "Email already registered", 409);
        return;
      }

      const hashedPassword = await hashPassword(password);

      // Generate 6-digit code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const codeExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            verificationCode, // add these fields to your schema
            codeExpiresAt,
            isVerified: false,
          },
        });

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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        to: user.email,
        subject: "Your verification code",
        html: `
        <h2>Welcome ${firstName}!</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #137FEC;">${verificationCode}</h1>
        <p>This code expires in <strong>5 minutes</strong>.</p>
      `,
      });

      sendSuccess(
        res,
        { email: user.email },
        "Verification code sent to your email",
        201,
      );
    } catch (error) {
      console.error("Register error:", error);
      sendError(res, "Registration failed", 500);
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
