import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { pushNotification } from "../utils/redis";

export class InternalController {
  static async create(req: Request, res: Response) {
    try {
      const { userId, type, title, body, classId, postId } = req.body;

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          classId: classId || null,
          postId: postId || null,
        },
      });

      await pushNotification(userId, notification);

      sendSuccess(res, notification, "Notification created", 201);
    } catch (error) {
      console.error("Error creating notification:", error);
      sendError(res, "Failed to create notification", 500);
    }
  }

  static async createBulk(req: Request, res: Response) {
    try {
      const { userIds, type, title, body, classId, postId } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return sendError(res, "userIds must be a non-empty array", 400);
      }

      const data = userIds.map((userId: string) => ({
        userId,
        type,
        title,
        body: body || null,
        classId: classId || null,
        postId: postId || null,
      }));

      const count = await prisma.notification.createMany({ data });

      const notifications = await prisma.notification.findMany({
        where: {
          userId: { in: userIds },
          type,
          classId: classId || null,
        },
        orderBy: { createdAt: "desc" },
        take: userIds.length,
      });

      for (const notif of notifications) {
        await pushNotification(notif.userId, notif);
      }

      sendSuccess(res, { count: count.count }, "Notifications created", 201);
    } catch (error) {
      console.error("Error creating bulk notifications:", error);
      sendError(res, "Failed to create notifications", 500);
    }
  }

  static async deleteByClass(req: Request, res: Response) {
    try {
      const classId = req.params.classId as string;

      const result = await prisma.notification.deleteMany({
        where: { classId },
      });

      sendSuccess(res, { deleted: result.count }, "Notifications cleaned up");
    } catch (error) {
      console.error("Error deleting notifications by class:", error);
      sendError(res, "Failed to clean up notifications", 500);
    }
  }
}
