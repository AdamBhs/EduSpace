import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { publishEvent, Events } from "../../../../shared/src";
import { checkMembership } from "../utils/classService";

export class SubmissionController {
  static async submit(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { postId, content, attachments } = req.body;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return sendError(res, "Post not found", 404);
      }
      if (post.type !== "ASSIGNMENT" && post.type !== "QUIZ" && post.type !== "QUESTION") {
        return sendError(res, "Can only submit to assignments, quizzes, and questions", 400);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }
      if (membership.classroomType === "FRIENDLY") {
        return sendError(res, "Submissions are not available in friendly classrooms", 400);
      }
      if (membership.role !== "MEMBER") {
        return sendError(res, "Only members/students can submit", 403);
      }

      const existing = await prisma.submission.findUnique({
        where: { postId_studentId: { postId, studentId: userId } },
      });
      if (existing) {
        return sendError(res, "Already submitted — update your existing submission", 409);
      }

      if (post.type === "QUESTION" && attachments?.length) {
        return sendError(res, "File attachments are not allowed for question answers", 400);
      }

      let autoPoints: number | undefined;
      let autoFeedback: string | undefined;

      if (post.type === "QUIZ") {
        if (!content) {
          return sendError(res, "Quiz answers are required", 400);
        }

        let answers: { answers: Record<string, number> };
        try {
          answers = typeof content === "string" ? JSON.parse(content) : content;
        } catch {
          return sendError(res, "Invalid quiz answer format", 400);
        }

        if (!answers.answers || typeof answers.answers !== "object") {
          return sendError(res, "Quiz answers must map question IDs to selected indices", 400);
        }

        const quizData = post.quizData as any;
        let totalEarned = 0;
        const results: { questionId: string; correct: boolean; earnedPoints: number }[] = [];

        for (const question of quizData.questions) {
          const selectedIndex = answers.answers[question.id];
          const isCorrect = selectedIndex === question.correctIndex;
          const earned = isCorrect ? question.points : 0;
          totalEarned += earned;
          results.push({ questionId: question.id, correct: isCorrect, earnedPoints: earned });
        }

        autoPoints = totalEarned;
        autoFeedback = JSON.stringify({
          autoGraded: true,
          results,
          totalEarned,
          totalPossible: post.maxPoints,
        });
      }

      if (post.type === "QUESTION") {
        const qd = post.quizData as any;
        if (qd?.answerType === "multiple_choice") {
          if (!content) {
            return sendError(res, "Answer is required", 400);
          }

          let answers: { answers: Record<string, number> };
          try {
            answers = typeof content === "string" ? JSON.parse(content) : content;
          } catch {
            return sendError(res, "Invalid answer format", 400);
          }

          if (!answers.answers || typeof answers.answers !== "object") {
            return sendError(res, "Answer must map question ID to selected index", 400);
          }

          const q = qd.question;
          const selectedIndex = answers.answers[q.id];
          const isCorrect = selectedIndex === q.correctIndex;
          const earned = isCorrect ? q.points : 0;

          autoPoints = earned;
          autoFeedback = JSON.stringify({
            autoGraded: true,
            results: [{ questionId: q.id, correct: isCorrect, earnedPoints: earned }],
            totalEarned: earned,
            totalPossible: post.maxPoints,
          });
        } else if (qd?.answerType === "text") {
          if (!content || !content.trim()) {
            return sendError(res, "A text answer is required", 400);
          }
        }
      }

      const isAutoGraded = (post.type === "QUIZ") ||
        (post.type === "QUESTION" && (post.quizData as any)?.answerType === "multiple_choice");

      const submission = await prisma.submission.create({
        data: {
          postId,
          studentId: userId,
          content,
          ...(isAutoGraded && autoPoints !== undefined && {
            points: autoPoints,
            feedback: autoFeedback,
            gradedAt: new Date(),
          }),
          attachments: post.type !== "QUESTION" && attachments?.length
            ? {
                create: attachments.map((a: any) => ({
                  fileKey: a.fileKey,
                  fileName: a.fileName,
                  fileType: a.fileType,
                  fileSize: a.fileSize,
                })),
              }
            : undefined,
        },
        include: { attachments: true },
      });

      sendSuccess(res, submission, "Submission created", 201);
    } catch (error) {
      console.error("Error creating submission:", error);
      sendError(res, "Failed to create submission", 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.submissionId as string;
      const { content, attachments } = req.body;

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
      });
      if (!submission) {
        return sendError(res, "Submission not found", 404);
      }
      if (submission.studentId !== userId) {
        return sendError(res, "Can only update your own submission", 403);
      }

      const submissionPost = await prisma.post.findUnique({ where: { id: submission.postId } });
      if (submissionPost?.type === "QUIZ") {
        return sendError(res, "Cannot update quiz submissions", 400);
      }
      if (submissionPost?.type === "QUESTION") {
        const qd = submissionPost.quizData as any;
        if (qd?.answerType === "multiple_choice") {
          return sendError(res, "Cannot update auto-graded question submissions", 400);
        }
      }

      if (submission.gradedAt) {
        return sendError(res, "Cannot update a graded submission", 400);
      }

      const updated = await prisma.$transaction(async (tx: any) => {
        if (attachments) {
          await tx.submissionAttachment.deleteMany({ where: { submissionId } });
        }

        return tx.submission.update({
          where: { id: submissionId },
          data: {
            ...(content !== undefined && { content }),
            ...(attachments && {
              attachments: {
                create: attachments.map((a: any) => ({
                  fileKey: a.fileKey,
                  fileName: a.fileName,
                  fileType: a.fileType,
                  fileSize: a.fileSize,
                })),
              },
            }),
          },
          include: { attachments: true },
        });
      });

      sendSuccess(res, updated, "Submission updated");
    } catch (error) {
      console.error("Error updating submission:", error);
      sendError(res, "Failed to update submission", 500);
    }
  }

  static async getMySubmissions(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const submissions = await prisma.submission.findMany({
        where: { studentId: userId },
        select: { postId: true, gradedAt: true, points: true },
      });

      sendSuccess(res, submissions, "User submissions retrieved");
    } catch (error) {
      console.error("Error getting user submissions:", error);
      sendError(res, "Failed to get user submissions", 500);
    }
  }

  static async getByPost(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const postId = req.params.postId as string;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return sendError(res, "Post not found", 404);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      if (membership.role === "ADMIN") {
        const submissions = await prisma.submission.findMany({
          where: { postId },
          include: { attachments: true },
          orderBy: { createdAt: "desc" },
        });
        return sendSuccess(res, submissions, "Submissions retrieved");
      }

      const submission = await prisma.submission.findUnique({
        where: { postId_studentId: { postId, studentId: userId } },
        include: { attachments: true },
      });
      sendSuccess(res, submission, "Submission retrieved");
    } catch (error) {
      console.error("Error getting submissions:", error);
      sendError(res, "Failed to get submissions", 500);
    }
  }

  static async grade(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const submissionId = req.params.submissionId as string;
      const { points, feedback } = req.body;

      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: { post: true },
      });
      if (!submission) {
        return sendError(res, "Submission not found", 404);
      }

      const membership = await checkMembership(
        submission.post.classId,
        userId,
        req.headers.authorization,
      );
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can grade submissions", 403);
      }
      if (membership.classroomType === "FRIENDLY") {
        return sendError(res, "Grading is not available in friendly classrooms", 400);
      }

      if (submission.post.maxPoints === null || submission.post.maxPoints === undefined) {
        return sendError(res, "Cannot grade: assignment has no max points configured", 400);
      }
      if (points > submission.post.maxPoints) {
        return sendError(res, `Points cannot exceed max (${submission.post.maxPoints})`, 400);
      }

      const graded = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          points,
          feedback,
          gradedAt: new Date(),
        },
        include: { attachments: true },
      });

      await publishEvent(Events.SUBMISSION_GRADED, {
        submissionId: graded.id,
        studentId: graded.studentId,
        postId: graded.postId,
        classId: submission.post.classId,
        points: graded.points,
        maxPoints: submission.post.maxPoints,
        postTitle: submission.post.title,
      });

      sendSuccess(res, graded, "Submission graded");
    } catch (error) {
      console.error("Error grading submission:", error);
      sendError(res, "Failed to grade submission", 500);
    }
  }
}
