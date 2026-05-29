import { prisma } from "../db/prisma";
import { pushNotification } from "../utils/redis";
import { fetchMemberIds } from "../utils/classService";
import { fetchUserEmails } from "../utils/userService";
import { fetchUpcomingDue } from "../utils/contentService";
import { sendEmail } from "../utils/email";

const notifiedSet = new Set<string>();

export async function checkDueReminders(): Promise<void> {
  try {
    const assignments = await fetchUpcomingDue();

    for (const assignment of assignments) {
      if (notifiedSet.has(assignment.id)) continue;
      notifiedSet.add(assignment.id);

      const { allIds } = await fetchMemberIds(assignment.classId);
      if (allIds.length === 0) continue;

      const dueStr = new Date(assignment.dueDate).toLocaleString();

      for (const userId of allIds) {
        const notification = await prisma.notification.create({
          data: {
            userId,
            type: "ASSIGNMENT_DUE",
            title: "Assignment due soon",
            body: `"${assignment.title}" is due ${dueStr}`,
            classId: assignment.classId,
            postId: assignment.id,
          },
        });
        await pushNotification(userId, notification);
      }

      const emails = await fetchUserEmails(allIds);
      for (const [, email] of emails) {
        await sendEmail(
          email,
          `Reminder: "${assignment.title}" is due soon`,
          `
          <h2>Assignment Due Reminder</h2>
          <p><strong>"${assignment.title}"</strong> is due on <strong>${dueStr}</strong>.</p>
          <p>Make sure to submit your work before the deadline.</p>
          <p>Log in to EduSpace to view the assignment.</p>
          `,
        );
      }
    }
  } catch (error) {
    console.error("[dueReminder] Error checking due reminders:", error);
  }
}

const ONE_HOUR = 60 * 60 * 1000;

export function startDueReminderJob(): void {
  checkDueReminders();
  setInterval(checkDueReminders, ONE_HOUR);
  console.log("Due reminder job started (runs every hour)");
}
