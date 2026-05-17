import { Server, Socket } from "socket.io";
import { verifyToken } from "../../../../shared/src/utils/jwt";
import { prisma } from "../db/prisma";
import { setOnline, setOffline, refreshPresence, getOnlineUsers } from "../utils/redis";

interface AuthSocket extends Socket {
  userId?: string;
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

    const presenceInterval = setInterval(() => {
      refreshPresence(userId);
    }, 60_000);

    socket.on("disconnect", async () => {
      clearInterval(presenceInterval);
      await setOffline(userId);

      for (const room of socket.rooms) {
        if (room.startsWith("chat:")) {
          const onlineUsers = await getRoomOnlineUsers(io, room);
          io.to(room).emit("presence-update", onlineUsers);
        }
      }
    });
  });
}

async function getRoomOnlineUsers(io: Server, room: string): Promise<string[]> {
  const sockets = await io.in(room).fetchSockets();
  const userIds = [...new Set(sockets.map((s) => (s as any).userId as string).filter(Boolean))];
  return getOnlineUsers(userIds);
}
