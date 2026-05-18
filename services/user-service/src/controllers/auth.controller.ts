import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import {
  hashPassword,
  comparePassword,
} from "../../../../shared/src/utils/password";
import { generateToken } from "../../../../shared/src/utils/jwt";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class AuthController {
  /**
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

      const cooldown = 60 * 1000;
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

      const firstName = user.profile?.first_name || "there";

      try {
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
      } catch (emailErr) {
        console.warn("Email sending failed — verification code:", verificationCode);
      }

      sendSuccess(res, null, "Verification code resent successfully");
    } catch (error) {
      console.error("Resend code error:", error);
      sendError(res, "Failed to resend code", 500);
    }
  }

  /**
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

      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      const codeExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const user = await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            verificationCode,
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

      try {
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
      } catch (emailErr) {
        console.warn("Email sending failed — verification code:", verificationCode);
      }

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
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });

      if (!user) {
        sendError(res, "Invalid credentials", 401);
        return;
      }

      if (!user.isVerified) {
        sendError(res, "Account is not active", 403);
        return;
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        sendError(res, "Invalid credentials", 401);
        return;
      }

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
   * GET /api/auth/verify
   */
  static async verify(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { userId },
        include: { profile: true },
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
   * POST /api/auth/request-reset
   */
  static async requestPasswordReset(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        sendSuccess(res, { message: "A password reset link has been sent" });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      await prisma.password_reset.create({
        data: {
          user_id: user.userId,
          reset_token_hash: resetTokenHash,
          expires_at: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      console.log("Reset Token:", resetToken);

      sendSuccess(res, {
        message: "A password reset link has been sent",
        resetToken:
          process.env.NODE_ENV === "development" ? resetToken : undefined,
      });
    } catch (error) {
      console.error("Request reset error:", error);
      sendError(res, "Password reset request failed", 500);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { resetToken, newPassword } = req.body;

      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const passwordReset = await prisma.password_reset.findUnique({
        where: { reset_token_hash: resetTokenHash },
        include: { user: true },
      });

      if (!passwordReset) {
        sendError(res, "Invalid or expired reset token", 400);
        return;
      }

      if (passwordReset.expires_at < new Date()) {
        sendError(res, "Reset token has expired", 400);
        return;
      }

      if (passwordReset.used_at) {
        sendError(res, "Reset token has already been used", 400);
        return;
      }

      const hashedPassword = await hashPassword(newPassword);

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

      sendSuccess(res, { message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      sendError(res, "Password reset failed", 500);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      sendSuccess(res, { message: "Logout successful" });
    } catch (error) {
      console.error("Logout error:", error);
      sendError(res, "Logout failed", 500);
    }
  }
}
