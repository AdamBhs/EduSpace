import { subscribeToEvents, Events } from "../../../../shared/src";
import { prisma } from "../db/prisma";
import { pushNotification } from "../utils/redis";
import { fetchMemberIds } from "../utils/classService";
import { fetchUserEmails } from "../utils/userService";
import { sendEmail } from "../utils/email";

async function createAndPush(data: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  classId?: string;
  postId?: string;
}): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type as any,
      title: data.title,
      body: data.body || null,
      classId: data.classId || null,
      postId: data.postId || null,
    },
  });
  await pushNotification(data.userId, notification);
}

async function notifyMany(
  userIds: string[],
  type: string,
  title: string,
  body?: string,
  classId?: string,
  postId?: string,
): Promise<void> {
  for (const userId of userIds) {
    await createAndPush({ userId, type, title, body, classId, postId });
  }
}

export async function startConsumers(): Promise<void> {
  await subscribeToEvents(
    "notification-service",
    [
      Events.POST_CREATED,
      Events.SUBMISSION_GRADED,
      Events.CHAT_MESSAGE,
    ],
    async (event, payload) => {
      switch (event) {
        case Events.POST_CREATED: {
          const { allIds } = await fetchMemberIds(payload.classId);
          const recipients = allIds.filter((id: string) => id !== payload.authorId);
          const body = `A new ${payload.type.toLowerCase().replace("_", " ")} "${payload.title}" was posted`;
          await notifyMany(
            recipients,
            "POST_CREATED",
            "New post",
            body,
            payload.classId,
            payload.postId,
          );

          const emails = await fetchUserEmails(recipients);
          for (const [userId, email] of emails) {
            await sendEmail(
              email,
              `New post: "${payload.title}"`,
              `
              <h2>New Post in Your Classroom</h2>
              <p>A new <strong>${payload.type.toLowerCase().replace("_", " ")}</strong> has been posted:</p>
              <p style="font-size: 18px; font-weight: bold; color: #137FEC;">${payload.title}</p>
              ${payload.content ? `<p>${payload.content.slice(0, 200)}${payload.content.length > 200 ? "..." : ""}</p>` : ""}
              <p>Log in to EduSpace to view the full post.</p>
              `,
            );
          }
          break;
        }

        case Events.SUBMISSION_GRADED: {
          const score = payload.maxPoints
            ? `${payload.points}/${payload.maxPoints}`
            : `${payload.points} points`;
          await createAndPush({
            userId: payload.studentId,
            type: "SUBMISSION_GRADED",
            title: "Submission graded",
            body: `Your submission for "${payload.postTitle}" received ${score}`,
            classId: payload.classId,
            postId: payload.postId,
          });

          const emails = await fetchUserEmails([payload.studentId]);
          const studentEmail = emails.get(payload.studentId);
          if (studentEmail) {
            await sendEmail(
              studentEmail,
              `Your submission for "${payload.postTitle}" has been graded`,
              `
              <h2>Submission Graded</h2>
              <p>Your submission for <strong>"${payload.postTitle}"</strong> has been graded.</p>
              <p style="font-size: 24px; color: #137FEC; font-weight: bold;">${score}</p>
              ${payload.feedback ? `<p><strong>Feedback:</strong> ${payload.feedback}</p>` : ""}
              <p>Log in to EduSpace to view the details.</p>
              `,
            );
          }
          break;
        }

        case Events.CHAT_MESSAGE: {
          const { allIds } = await fetchMemberIds(payload.classId);
          const recipients = allIds.filter((id: string) => id !== payload.senderId);
          await notifyMany(
            recipients,
            "CHAT_MESSAGE",
            "New chat message",
            payload.content
              ? `New message in the group chat: "${payload.content.slice(0, 80)}${payload.content.length > 80 ? "..." : ""}"`
              : "A file was shared in the group chat",
            payload.classId,
          );
          break;
        }
      }
    },
  );
}
