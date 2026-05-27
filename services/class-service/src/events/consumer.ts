import { subscribeToEvents, Events, publishEvent } from "../../../../shared/src";
import { prisma } from "../db/prisma";
import { cacheDelPattern } from "../../../../shared/src/utils/redis";

export async function startConsumers(): Promise<void> {
  await subscribeToEvents(
    "class-service",
    [Events.USER_DELETED],
    async (event, payload) => {
      switch (event) {
        case Events.USER_DELETED: {
          const { userId, classroomAction } = payload;

          const ownedClassrooms = await prisma.classroom.findMany({
            where: { creatorId: userId },
            include: {
              members: {
                select: { id: true, userId: true, role: true },
                orderBy: { joinedAt: "asc" },
              },
            },
          });

          for (const classroom of ownedClassrooms) {
            const otherAdmin = classroom.members.find(
              (m: { userId: string; role: string }) =>
                m.userId !== userId && m.role === "ADMIN",
            );

            if (otherAdmin && classroomAction === "transfer") {
              await prisma.classroom.update({
                where: { id: classroom.id },
                data: { creatorId: otherAdmin.userId },
              });
            } else {
              await prisma.classroom.delete({ where: { id: classroom.id } });
              await publishEvent(Events.CLASSROOM_DELETED, {
                classId: classroom.id,
              });
            }

            await cacheDelPattern(`*:${classroom.id}*`);
          }

          await prisma.member.deleteMany({ where: { userId } });

          console.log(
            `[Event] Cleaned up class data for deleted user ${userId}: ` +
              `${ownedClassrooms.length} owned classrooms handled (action: ${classroomAction})`,
          );
          break;
        }
      }
    },
  );
}
