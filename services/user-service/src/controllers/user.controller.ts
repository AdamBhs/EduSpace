// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";

export class UserController {
  /**
   * Get current user profile
   * GET /api/user/me
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
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
        user: {
          userId: user.userId,
          email: user.email,
          isVerified: user.isVerified,
          createdAt: user.created_at,
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
      console.error("Get profile error:", error);
      sendError(res, "Failed to get profile", 500);
    }
  }

  /**
   * Update user profile
   * PUT /api/user/me
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { firstName, lastName, phoneNumber, timezone } =
        req.body;

      if (!userId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { userId },
        include: { profile: true },
      });

      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      // Prepare update data (only include provided fields)
      const updateData: any = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
      if (timezone !== undefined) updateData.timezone = timezone;

      // Update or create profile
      const updatedProfile = await prisma.user_profile.upsert({
        where: { user_id: userId },
        update: updateData,
        create: {
          user_id: userId,
          first_name: firstName || "",
          last_name: lastName || "",
          phone_number: phoneNumber || null,
          timezone: timezone || "UTC",
        },
      });

      sendSuccess(res, {
        message: "Profile updated successfully",
        profile: {
          firstName: updatedProfile.first_name,
          lastName: updatedProfile.last_name,
          avatarUrl: updatedProfile.avatar_url,
          phoneNumber: updatedProfile.phone_number,
          timezone: updatedProfile.timezone,
          updatedAt: updatedProfile.updated_at,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      sendError(res, "Failed to update profile", 500);
    }
  }

  /**
   * Get user by ID (for other services)
   * GET /api/user/:userId
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

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
        user: {
          userId: user.userId,
          email: user.email,
          isVerified: user.isVerified,
          profile: user.profile
            ? {
                firstName: user.profile.first_name,
                lastName: user.profile.last_name,
                avatarUrl: user.profile.avatar_url,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Get user by ID error:", error);
      sendError(res, "Failed to get user", 500);
    }
  }

  /**
   * Delete user account
   * DELETE /api/user/me
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      await prisma.user_profile.delete({
        where: { user_id: userId },
      });
      await prisma.user.delete({
        where: { userId },
      });

      sendSuccess(res, {
        message: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Delete account error:", error);
      sendError(res, "Failed to delete account", 500);
    }
  }

  /**
   * Get multiple user by IDs (for other services)
   * POST /api/user/batch
   */
  static async getUserByIds(req: Request, res: Response): Promise<void> {
    try {
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        sendError(res, "userIds array is required", 400);
        return;
      }

      const user = await prisma.user.findMany({
        where: {
          userId: { in: userIds },
        },
        include: {
          profile: true,
        },
      });

      const formattedUser = user.map((user) => ({
        userId: user.userId,
        email: user.email,
        isVerified: user.isVerified,
        profile: user.profile
          ? {
              firstName: user.profile.first_name,
              lastName: user.profile.last_name,
              avatarUrl: user.profile.avatar_url,
            }
          : null,
      }));

      sendSuccess(res, {
        user: formattedUser,
      });
    } catch (error) {
      console.error("Get user by IDs error:", error);
      sendError(res, "Failed to get user", 500);
    }
  }
}
