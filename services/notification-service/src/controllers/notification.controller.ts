import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { verifyToken } from "../../../../shared/src/utils/jwt";
import { createSubscriber, channelForUser } from "../utils/redis";

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const nextCursor =
        notifications.length === limit
          ? notifications[notifications.length - 1].createdAt.toISOString()
          : null;

      sendSuccess(res, { notifications, nextCursor }, "Notifications retrieved");
    } catch (error) {
      console.error("Error getting notifications:", error);
      sendError(res, "Failed to get notifications", 500);
    }
  }

  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      sendSuccess(res, { count }, "Unread count retrieved");
    } catch (error) {
      console.error("Error getting unread count:", error);
      sendError(res, "Failed to get unread count", 500);
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.notificationId as string;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        return sendError(res, "Notification not found", 404);
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      sendSuccess(res, updated, "Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      sendError(res, "Failed to mark as read", 500);
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      sendSuccess(res, null, "All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      sendError(res, "Failed to mark all as read", 500);
    }
  }

  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const notificationId = req.params.notificationId as string;

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        return sendError(res, "Notification not found", 404);
      }

      await prisma.notification.delete({ where: { id: notificationId } });

      sendSuccess(res, null, "Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      sendError(res, "Failed to delete notification", 500);
    }
  }

  static async deleteAll(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      await prisma.notification.deleteMany({ where: { userId } });

      sendSuccess(res, null, "All notifications deleted");
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      sendError(res, "Failed to delete all notifications", 500);
    }
  }

  static async stream(req: Request, res: Response) {
    const token = req.query.token as string;
    if (!token) {
      return sendError(res, "No token provided", 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return sendError(res, "Invalid or expired token", 401);
    }

    const userId = decoded.userId;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write("\n");

    const subscriber = createSubscriber();
    const channel = channelForUser(userId);

    await subscriber.subscribe(channel);

    subscriber.on("message", (_ch: string, message: string) => {
      res.write(`event: notification\ndata: ${message}\n\n`);
    });

    const heartbeat = setInterval(() => {
      res.write(": heartbeat\n\n");
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe(channel).catch(() => {});
      subscriber.disconnect();
    });
  }
}
