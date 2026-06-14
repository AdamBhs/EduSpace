import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { checkFriendship, getSharedMembers } from "../utils/classService";
import { getOnlineUsers } from "../utils/redis";

export class DmController {
  static async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const conversations = await prisma.directConversation.findMany({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          readStates: { where: { userId } },
        },
        orderBy: { updatedAt: "desc" },
      });

      const result = await Promise.all(
        conversations.map(async (c: any) => {
          const lastReadAt = c.readStates[0]?.lastReadAt;
          const unreadCount = await prisma.directMessage.count({
            where: {
              conversationId: c.id,
              senderId: { not: userId },
              ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
            },
          });
          return {
            id: c.id,
            otherUserId: c.participant1Id === userId ? c.participant2Id : c.participant1Id,
            lastMessage: c.messages[0] ?? null,
            unreadCount,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          };
        }),
      );

      sendSuccess(res, result, "Conversations retrieved");
    } catch (error) {
      console.error("Error getting DM conversations:", error);
      sendError(res, "Failed to get conversations", 500);
    }
  }

  static async createConversation(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { otherUserId } = req.body;

      if (!otherUserId) {
        return sendError(res, "otherUserId is required", 400);
      }

      if (otherUserId === userId) {
        return sendError(res, "Cannot start a conversation with yourself", 400);
      }

      const isFriend = await checkFriendship(userId, otherUserId);
      if (!isFriend) {
        return sendError(res, "You can only message users who share a classroom with you", 403);
      }

      const [p1, p2] = [userId, otherUserId].sort();

      const existing = await prisma.directConversation.findUnique({
        where: { participant1Id_participant2Id: { participant1Id: p1, participant2Id: p2 } },
      });

      if (existing) {
        return sendSuccess(res, {
          id: existing.id,
          otherUserId,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        }, "Conversation already exists");
      }

      const conversation = await prisma.directConversation.create({
        data: { participant1Id: p1, participant2Id: p2 },
      });

      sendSuccess(res, {
        id: conversation.id,
        otherUserId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }, "Conversation created", 201);
    } catch (error) {
      console.error("Error creating DM conversation:", error);
      sendError(res, "Failed to create conversation", 500);
    }
  }

  static async getUnreadTotal(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const conversations = await prisma.directConversation.findMany({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
        },
        include: { readStates: { where: { userId } } },
      });

      const counts = await Promise.all(
        conversations.map((c: any) =>
          prisma.directMessage.count({
            where: {
              conversationId: c.id,
              senderId: { not: userId },
              ...(c.readStates[0]?.lastReadAt ? { createdAt: { gt: c.readStates[0].lastReadAt } } : {}),
            },
          }),
        ),
      );

      sendSuccess(res, { count: counts.reduce((a: number, b: number) => a + b, 0) }, "Unread total retrieved");
    } catch (error) {
      console.error("Error getting DM unread total:", error);
      sendError(res, "Failed to get unread total", 500);
    }
  }

  static async getConversation(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, "Conversation not found", 404);
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return sendError(res, "Not a participant in this conversation", 403);
      }

      sendSuccess(res, {
        id: conversation.id,
        otherUserId:
          conversation.participant1Id === userId
            ? conversation.participant2Id
            : conversation.participant1Id,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      }, "Conversation retrieved");
    } catch (error) {
      console.error("Error getting DM conversation:", error);
      sendError(res, "Failed to get conversation", 500);
    }
  }

  static async getMessages(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.conversationId as string;
      const cursor = req.query.cursor as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, "Conversation not found", 404);
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return sendError(res, "Not a participant in this conversation", 403);
      }

      const messages = await prisma.directMessage.findMany({
        where: {
          conversationId,
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
      console.error("Error getting DM messages:", error);
      sendError(res, "Failed to get messages", 500);
    }
  }

  static async getReads(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, "Conversation not found", 404);
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return sendError(res, "Not a participant in this conversation", 403);
      }

      const reads = await prisma.directReadState.findMany({
        where: { conversationId },
        select: { userId: true, lastReadAt: true },
      });

      sendSuccess(res, reads, "Read states retrieved");
    } catch (error) {
      console.error("Error getting DM read states:", error);
      sendError(res, "Failed to get read states", 500);
    }
  }

  static async getPinned(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, "Conversation not found", 404);
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return sendError(res, "Not a participant in this conversation", 403);
      }

      const pinned = await prisma.directMessage.findMany({
        where: { conversationId, pinnedAt: { not: null } },
        orderBy: { pinnedAt: "desc" },
      });

      sendSuccess(res, pinned, "Pinned messages retrieved");
    } catch (error) {
      console.error("Error getting pinned DM messages:", error);
      sendError(res, "Failed to get pinned messages", 500);
    }
  }

  static async getSharedFiles(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, "Conversation not found", 404);
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return sendError(res, "Not a participant in this conversation", 403);
      }

      const files = await prisma.directMessage.findMany({
        where: {
          conversationId,
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
      const conversationId = req.params.conversationId as string;

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, "Conversation not found", 404);
      }

      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) {
        return sendError(res, "Not a participant in this conversation", 403);
      }

      const messages = await prisma.directMessage.findMany({
        where: {
          conversationId,
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

  static async getFriends(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const friendIds = await getSharedMembers(userId);
      sendSuccess(res, friendIds, "Friends retrieved");
    } catch (error) {
      console.error("Error getting friends:", error);
      sendError(res, "Failed to get friends", 500);
    }
  }

  static async getFriendsWithStatus(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const friendIds = await getSharedMembers(userId);
      const onlineIds = await getOnlineUsers(friendIds);
      const onlineSet = new Set(onlineIds);

      const friends = friendIds.map((id) => ({
        userId: id,
        online: onlineSet.has(id),
      }));

      friends.sort((a, b) => (a.online === b.online ? 0 : a.online ? -1 : 1));

      sendSuccess(res, friends, "Friends with status retrieved");
    } catch (error) {
      console.error("Error getting friends with status:", error);
      sendError(res, "Failed to get friends with status", 500);
    }
  }
}
