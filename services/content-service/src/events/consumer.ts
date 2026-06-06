import { subscribeToEvents, Events } from "../../../../shared/src";
import { prisma } from "../db/prisma";

export async function startConsumers(): Promise<void> {
  await subscribeToEvents(
    "content-service",
    [Events.CHAPTER_DELETED, Events.CLASSROOM_DELETED, Events.USER_DELETED],
    async (event, payload) => {
      switch (event) {
        case Events.CHAPTER_DELETED: {
          if (!payload.generalChapterId) break;
          const result = await prisma.post.updateMany({
            where: { chapterId: payload.chapterId },
            data: { chapterId: payload.generalChapterId },
          });
          if (result.count > 0) {
            console.log(`[Event] Moved ${result.count} posts to General chapter for classroom ${payload.classId}`);
          }
          break;
        }

        case Events.CLASSROOM_DELETED: {
          const result = await prisma.post.deleteMany({
            where: { classId: payload.classId },
          });
          if (result.count > 0) {
            console.log(`[Event] Deleted ${result.count} posts for classroom ${payload.classId}`);
          }
          break;
        }

        case Events.USER_DELETED: {
          const { userId } = payload;
          const comments = await prisma.comment.deleteMany({
            where: { authorId: userId },
          });
          const submissions = await prisma.submission.deleteMany({
            where: { studentId: userId },
          });
          console.log(
            `[Event] Cleaned up content for deleted user ${userId}: ` +
              `${comments.count} comments, ${submissions.count} submissions deleted`,
          );
          break;
        }
      }
    },
  );
}
