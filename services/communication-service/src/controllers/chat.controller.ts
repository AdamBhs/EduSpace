import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { checkMembership, fetchMemberIds } from "../utils/classService";
import { getOnlineUsers } from "../utils/redis";

export class ChatController {
  static async getMessages(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const room = await prisma.chatRoom.findUnique({ where: { classId } });
      if (!room) {
        return sendError(res, "Chat room not found", 404);
      }
      if (!room.enabled) {
        return sendError(res, "Chat is disabled for this classroom", 403);
      }

      const messages = await prisma.message.findMany({
        where: {
          chatRoomId: room.id,
          ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const nextCursor =
        messages.length === limit
          ? messages[messages.length - 1].createdAt.toISOString()
          : null;

      sendSuccess(res, { messages: messages.reverse(), nextCursor }, "Messages retrieved");
    } catch (error) {
      console.error("Error getting messages:", error);
      sendError(res, "Failed to get messages", 500);
    }
  }

  static async getRoomInfo(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const room = await prisma.chatRoom.findUnique({
        where: { classId },
        include: { _count: { select: { messages: true } } },
      });

      if (!room) {
        return sendSuccess(res, { exists: false, enabled: false }, "No chat room");
      }

      sendSuccess(res, {
        exists: true,
        id: room.id,
        classId: room.classId,
        enabled: room.enabled,
        messageCount: room._count.messages,
      }, "Chat room info retrieved");
    } catch (error) {
      console.error("Error getting room info:", error);
      sendError(res, "Failed to get room info", 500);
    }
  }

  static async getReads(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const room = await prisma.chatRoom.findUnique({ where: { classId } });
      if (!room) {
        return sendError(res, "Chat room not found", 404);
      }

      const reads = await prisma.chatReadState.findMany({
        where: { chatRoomId: room.id },
        select: { userId: true, lastReadAt: true },
      });

      sendSuccess(res, reads, "Read states retrieved");
    } catch (error) {
      console.error("Error getting read states:", error);
      sendError(res, "Failed to get read states", 500);
    }
  }

  static async getOnlineMembers(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const memberIds = await fetchMemberIds(classId);
      const onlineIds = await getOnlineUsers(memberIds);
      sendSuccess(res, onlineIds, "Online members retrieved");
    } catch (error) {
      console.error("Error getting online members:", error);
      sendError(res, "Failed to get online members", 500);
    }
  }

  static async getSharedFiles(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const room = await prisma.chatRoom.findUnique({ where: { classId } });
      if (!room) {
        return sendError(res, "Chat room not found", 404);
      }

      const files = await prisma.message.findMany({
        where: {
          chatRoomId: room.id,
          fileKey: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          senderId: true,
          fileKey: true,
          fileName: true,
          createdAt: true,
        },
      });

      sendSuccess(res, files, "Shared files retrieved");
    } catch (error) {
      console.error("Error getting shared files:", error);
      sendError(res, "Failed to get shared files", 500);
    }
  }

  static async getSharedLinks(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const room = await prisma.chatRoom.findUnique({ where: { classId } });
      if (!room) {
        return sendError(res, "Chat room not found", 404);
      }

      const messages = await prisma.message.findMany({
        where: {
          chatRoomId: room.id,
          content: { contains: "http" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          senderId: true,
          content: true,
          createdAt: true,
        },
      });

      const urlRegex = /https?:\/\/[^\s]+/g;
      const links = messages.flatMap((msg: { id: string; senderId: string; content: string | null; createdAt: Date }) => {
        const urls = msg.content?.match(urlRegex) ?? [];
        return urls.map((url: string) => ({
          id: msg.id,
          senderId: msg.senderId,
          url,
          createdAt: msg.createdAt,
        }));
      });

      sendSuccess(res, links, "Shared links retrieved");
    } catch (error) {
      console.error("Error getting shared links:", error);
      sendError(res, "Failed to get shared links", 500);
    }
  }

  static async createRoom(req: Request, res: Response) {
    try {
      const { classId, enabled } = req.body;

      const existing = await prisma.chatRoom.findUnique({ where: { classId } });
      if (existing) {
        return sendSuccess(res, existing, "Chat room already exists");
      }

      const room = await prisma.chatRoom.create({
        data: { classId, enabled: enabled ?? true },
      });

      sendSuccess(res, room, "Chat room created", 201);
    } catch (error) {
      console.error("Error creating chat room:", error);
      sendError(res, "Failed to create chat room", 500);
    }
  }

  static async toggleRoom(req: Request, res: Response) {
    try {
      const classId = req.params.classId as string;
      const { enabled } = req.body;

      const room = await prisma.chatRoom.findUnique({ where: { classId } });
      if (!room) {
        return sendError(res, "Chat room not found", 404);
      }

      const updated = await prisma.chatRoom.update({
        where: { classId },
        data: { enabled },
      });

      sendSuccess(res, updated, `Chat ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error toggling chat room:", error);
      sendError(res, "Failed to toggle chat room", 500);
    }
  }

  static async deleteRoom(req: Request, res: Response) {
    try {
      const classId = req.params.classId as string;

      await prisma.chatRoom.delete({ where: { classId } }).catch(() => {});

      sendSuccess(res, null, "Chat room deleted");
    } catch (error) {
      console.error("Error deleting chat room:", error);
      sendError(res, "Failed to delete chat room", 500);
    }
  }
}
