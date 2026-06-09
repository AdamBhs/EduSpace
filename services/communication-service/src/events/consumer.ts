import { subscribeToEvents, Events } from "../../../../shared/src";
import { prisma } from "../db/prisma";

export async function startConsumers(): Promise<void> {
  await subscribeToEvents(
    "communication-service",
    [Events.CLASSROOM_CREATED, Events.CLASSROOM_DELETED, Events.CHAT_TOGGLED, Events.USER_DELETED],
    async (event, payload) => {
      switch (event) {
        case Events.CLASSROOM_CREATED: {
          if (!payload.chatEnabled) break;
          const existing = await prisma.chatRoom.findUnique({
            where: { classId: payload.classId },
          });
          if (!existing) {
            await prisma.chatRoom.create({
              data: { classId: payload.classId, enabled: true },
            });
          }
          console.log(`[Event] Chat room created for classroom ${payload.classId}`);
          break;
        }

        case Events.CLASSROOM_DELETED: {
          await prisma.chatRoom.delete({
            where: { classId: payload.classId },
          }).catch(() => {});
          console.log(`[Event] Chat room deleted for classroom ${payload.classId}`);
          break;
        }

        case Events.CHAT_TOGGLED: {
          await prisma.chatRoom.upsert({
            where: { classId: payload.classId },
            update: { enabled: payload.enabled },
            create: { classId: payload.classId, enabled: payload.enabled },
          });
          console.log(`[Event] Chat ${payload.enabled ? "enabled" : "disabled"} for ${payload.classId}`);
          break;
        }

        case Events.USER_DELETED: {
          const result = await prisma.message.deleteMany({
            where: { senderId: payload.userId },
          });
          console.log(`[Event] Deleted ${result.count} messages for deleted user ${payload.userId}`);
          break;
        }
      }
    },
  );
}
