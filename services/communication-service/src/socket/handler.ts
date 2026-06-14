import { Server, Socket } from "socket.io";
import { verifyToken } from "../../../../shared/src/utils/jwt";
import { publishEvent, Events } from "../../../../shared/src";
import { prisma } from "../db/prisma";
import { setOnline, setOffline, refreshPresence, getOnlineUsers } from "../utils/redis";
import { checkFriendship, checkMembership } from "../utils/classService";

interface AuthSocket extends Socket {
  userId?: string;
  token?: string;
}

export function setupSocket(io: Server): void {
  io.use((socket: AuthSocket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error("Invalid token"));
    }

    socket.userId = decoded.userId;
    socket.token = token;
    // socket.data survives fetchSockets() across instances (Redis adapter)
    socket.data.userId = decoded.userId;
    next();
  });

  io.on("connection", async (socket: AuthSocket) => {
    const userId = socket.userId!;

    await setOnline(userId, socket.id);

    socket.on("join-room", async (classId: string) => {
      const room = await prisma.chatRoom.findUnique({
        where: { classId },
      });
      if (!room || !room.enabled) return;

      const membership = await checkMembership(classId, userId, `Bearer ${socket.token}`);
      if (!membership) return;

      socket.join(`chat:${classId}`);

      const onlineUsers = await getRoomOnlineUsers(io, `chat:${classId}`);
      io.to(`chat:${classId}`).emit("presence-update", onlineUsers);
    });

    socket.on("leave-room", (classId: string) => {
      socket.leave(`chat:${classId}`);
    });

    socket.on("send-message", async (data: {
      classId: string;
      content?: string;
      fileKey?: string;
      fileName?: string;
    }) => {
      const { classId, content, fileKey, fileName } = data;

      if (!content && !fileKey) return;

      // Membership was verified at join-room time
      if (!socket.rooms.has(`chat:${classId}`)) return;

      const room = await prisma.chatRoom.findUnique({
        where: { classId },
      });
      if (!room || !room.enabled) return;

      const message = await prisma.message.create({
        data: {
          chatRoomId: room.id,
          senderId: userId,
          content: content || null,
          fileKey: fileKey || null,
          fileName: fileName || null,
        },
      });

      io.to(`chat:${classId}`).emit("new-message", {
        ...message,
        classId,
      });

      await publishEvent(Events.CHAT_MESSAGE, {
        classId,
        senderId: userId,
        content: content || null,
      });
    });

    socket.on("typing", (classId: string) => {
      socket.to(`chat:${classId}`).emit("user-typing", {
        userId,
        classId,
      });
    });

    socket.on("stop-typing", (classId: string) => {
      socket.to(`chat:${classId}`).emit("user-stop-typing", {
        userId,
        classId,
      });
    });

    // ─── Direct Messages ─────────────────────────────────────

    socket.on("join-dm", async (conversationId: string) => {
      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation) return;
      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) return;

      socket.join(`dm:${conversationId}`);
    });

    socket.on("leave-dm", (conversationId: string) => {
      socket.leave(`dm:${conversationId}`);
    });

    socket.on("send-dm", async (data: {
      conversationId: string;
      content?: string;
      fileKey?: string;
      fileName?: string;
    }) => {
      const { conversationId, content, fileKey, fileName } = data;

      if (!content && !fileKey) return;

      const conversation = await prisma.directConversation.findUnique({
        where: { id: conversationId },
      });
      if (!conversation) return;
      if (conversation.participant1Id !== userId && conversation.participant2Id !== userId) return;

      const otherUserId = conversation.participant1Id === userId
        ? conversation.participant2Id
        : conversation.participant1Id;

      const isFriend = await checkFriendship(userId, otherUserId);
      if (!isFriend) return;

      const message = await prisma.directMessage.create({
        data: {
          conversationId,
          senderId: userId,
          content: content || null,
          fileKey: fileKey || null,
          fileName: fileName || null,
        },
      });

      await prisma.directConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      io.to(`dm:${conversationId}`).emit("new-dm", {
        ...message,
        conversationId,
      });
    });

    socket.on("dm-typing", (conversationId: string) => {
      socket.to(`dm:${conversationId}`).emit("dm-user-typing", {
        userId,
        conversationId,
      });
    });

    socket.on("dm-stop-typing", (conversationId: string) => {
      socket.to(`dm:${conversationId}`).emit("dm-user-stop-typing", {
        userId,
        conversationId,
      });
    });

    const presenceInterval = setInterval(() => {
      refreshPresence(userId);
    }, 60_000);

    // "disconnecting" still has socket.rooms populated; "disconnect" does not
    socket.on("disconnecting", async () => {
      clearInterval(presenceInterval);
      await setOffline(userId);

      for (const room of socket.rooms) {
        if (room.startsWith("chat:")) {
          const onlineUsers = await getRoomOnlineUsers(io, room);
          socket.to(room).emit("presence-update", onlineUsers.filter((id) => id !== userId));
        }
      }
    });
  });
}

async function getRoomOnlineUsers(io: Server, room: string): Promise<string[]> {
  const sockets = await io.in(room).fetchSockets();
  // socket.data is the only field available on remote sockets via the Redis adapter
  const userIds = [
    ...new Set(
      sockets
        .map((s) => (s.data?.userId ?? (s as any).userId) as string)
        .filter(Boolean),
    ),
  ];
  return getOnlineUsers(userIds);
}
