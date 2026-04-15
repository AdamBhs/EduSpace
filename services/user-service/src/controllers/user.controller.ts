// src/controllers/user.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import axios from "axios";
import FormData from "form-data";

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
      const { firstName, lastName, phoneNumber, timezone } = req.body;

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
   * Post /api/user/getUsers
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { users_ids } = req.body;
      if (!Array.isArray(users_ids) || users_ids.length === 0) {
        sendError(res, "users_ids must be a non-empty array", 400);
      }

      const users = await prisma.user.findMany({
        where: {
          userId: {
            in: users_ids,
          },
        },
        include: {
          profile: true,
        },
      });

      const formattedUsers = users.map((user) => ({
        userId: user.userId,
        userName: user.profile?.first_name ?? null,
        userLastName: user.profile?.last_name ?? null,
        profilePic: user.profile?.avatar_url ?? null,
      }));

      sendSuccess(res, formattedUsers, "Getting all users successfully", 201);
    } catch (error) {
      console.error("Error getting all users", error);
      sendError(res, "Faild getting all Users", 500);
    }
  }

  /**
   * Update user profile picture
   * put /api/user/updatePic
   */

  static async uploadAvatar(req: Request, res: Response) {
    try {
      const file = req.file;
      const userId = req.user?.userId;

      if (!file) return sendError(res, "No File uploaded", 400);
      if (!userId) return sendError(res, "User not authenticated", 401);

      const formData = new FormData();
      formData.append("file", file.buffer, file.originalname);
      formData.append("entityId", userId);
      formData.append("entityType", "avatar");

      // Call the API of the File service for uploading to s3 in minIO
      const response = await axios.post(
        "http://localhost:3010/api/auth/avatar_url/upload",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: req.headers.authorization!, // pass JWT
          },
        },
      );

      const response_url = await axios.get(
        "http://localhost:3010/api/auth/avatar_url/getProfilePic",
        {
          headers: {
            Authorization: req.headers.authorization!,
          },
        },
      );

      const { fileId } = response.data.data;
      const { url } = response_url.data.data;

      // Update user's avatar_url in user-pofile
      await prisma.user_profile.update({
        where: { user_id: userId },
        data: { avatar_url: url },
      });

      return sendSuccess(
        res,
        {
          fileId,
          avatarUrl: url,
        },
        "Avatar uploaded successfully",
        200,
      );
    } catch (error: any) {
      console.error(error);
      sendError(res, "Faild to Upload Avatar in User Service", 500);
    }
  }
}
