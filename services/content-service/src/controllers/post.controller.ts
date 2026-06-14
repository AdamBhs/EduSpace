import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { publishEvent, Events } from "../../../../shared/src";
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../../../../shared/src/utils/redis";
import { checkMembership } from "../utils/classService";

// Remove correctIndex from quiz/question data so students can't read answers
function stripAnswers(post: any): any {
  if (!post.quizData) return post;
  const qd = post.quizData as any;
  if (post.type === "QUIZ" && qd.questions) {
    return {
      ...post,
      quizData: {
        ...qd,
        questions: qd.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          options: q.options,
          points: q.points,
        })),
      },
    };
  }
  if (post.type === "QUESTION" && qd.question) {
    return {
      ...post,
      quizData: {
        ...qd,
        question: {
          id: qd.question.id,
          text: qd.question.text,
          options: qd.question.options,
          points: qd.question.points,
        },
      },
    };
  }
  return post;
}

export class PostController {
  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const {
        classId,
        chapterId,
        title,
        content,
        type,
        studyMaterialType,
        quizData,
        questionData,
        assignedTo,
        dueDate,
        maxPoints,
        attachments,
      } = req.body;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }
      if (membership.role !== "ADMIN") {
        return sendError(res, "Only admins can create posts", 403);
      }

      if (membership.classroomType === "FRIENDLY" && (type === "ASSIGNMENT" || type === "QUIZ" || type === "QUESTION")) {
        return sendError(res, `${type.replace("_", " ")} posts are not available in friendly classrooms`, 400);
      }

      const post = await prisma.post.create({
        data: {
          classId,
          chapterId,
          authorId: userId,
          title,
          content,
          type,
          studyMaterialType: type === "STUDY_MATERIAL" ? studyMaterialType : null,
          quizData: type === "QUIZ" ? quizData
                  : type === "QUESTION" ? questionData
                  : undefined,
          assignedTo: (type === "ASSIGNMENT" || type === "QUIZ" || type === "QUESTION") && assignedTo?.length
            ? assignedTo
            : undefined,
          dueDate: (type === "ASSIGNMENT" || type === "QUIZ" || type === "QUESTION") && dueDate ? new Date(dueDate) : null,
          maxPoints: type === "ASSIGNMENT" ? maxPoints
                   : type === "QUIZ" ? quizData.questions.reduce((sum: number, q: any) => sum + q.points, 0)
                   : type === "QUESTION" ? questionData.question.points
                   : null,
          attachments: type !== "QUIZ" && type !== "QUESTION" && attachments?.length
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

      await cacheDelPattern(`posts:${classId}:*`);

      await publishEvent(Events.POST_CREATED, {
        postId: post.id,
        classId,
        chapterId,
        authorId: userId,
        title: post.title,
        content: post.content,
        type: post.type,
        studyMaterialType: post.studyMaterialType,
        attachmentNames: post.attachments.map((a: any) => a.fileName),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      });

      sendSuccess(res, post, "Post created", 201);
    } catch (error) {
      console.error("Error creating post:", error);
      sendError(res, "Failed to create post", 500);
    }
  }

  static async getByClass(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const { type, studyMaterialType, chapterId, sort } = req.query;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      // Cache stores the raw list; visibility filtering and answer
      // stripping are per-user, so they must run on every request
      const cacheKey = `posts:${classId}:${type || ""}:${studyMaterialType || ""}:${chapterId || ""}:${sort || ""}`;
      const cached = await cacheGet<any[]>(cacheKey);
      let posts: any[];

      if (cached) {
        posts = cached;
      } else {
        const where: any = { classId };
        if (type) where.type = type as string;
        if (studyMaterialType) where.studyMaterialType = studyMaterialType as string;
        if (chapterId) where.chapterId = chapterId as string;

        let orderBy: any = { createdAt: "desc" };
        if (sort === "title") orderBy = { title: "asc" };
        if (sort === "dueDate") orderBy = { dueDate: "asc" };

        posts = await prisma.post.findMany({
          where,
          include: {
            attachments: true,
            _count: { select: { comments: true, submissions: true } },
          },
          orderBy,
        });

        await cacheSet(cacheKey, posts, 120);
      }

      let visiblePosts = membership.role === "MEMBER"
        ? posts.filter((p: any) => {
            if (!p.assignedTo) return true;
            const assigned = p.assignedTo as string[];
            return assigned.includes(userId);
          })
        : posts;

      if (membership.role !== "ADMIN") {
        visiblePosts = visiblePosts.map(stripAnswers);
      }

      sendSuccess(res, visiblePosts, "Posts retrieved");
    } catch (error) {
      console.error("Error getting posts:", error);
      sendError(res, "Failed to get posts", 500);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const postId = req.params.postId as string;

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
          attachments: true,
          comments: { orderBy: { createdAt: "asc" } },
          _count: { select: { submissions: true } },
        },
      });

      if (!post) {
        return sendError(res, "Post not found", 404);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      if (membership.role === "MEMBER" && post.assignedTo) {
        const assigned = post.assignedTo as string[];
        if (!assigned.includes(userId)) {
          return sendError(res, "You are not assigned to this post", 403);
        }
      }

      if (post.quizData && membership.role !== "ADMIN") {
        const studentSubmission = await prisma.submission.findUnique({
          where: { postId_studentId: { postId, studentId: userId } },
          select: { id: true },
        });

        // Answers stay hidden until the student has submitted
        if (!studentSubmission) {
          return sendSuccess(res, stripAnswers(post), "Post retrieved");
        }
      }

      sendSuccess(res, post, "Post retrieved");
    } catch (error) {
      console.error("Error getting post:", error);
      sendError(res, "Failed to get post", 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const postId = req.params.postId as string;
      const { title, content, chapterId, quizData, questionData, assignedTo, dueDate, maxPoints } = req.body;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return sendError(res, "Post not found", 404);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can update posts", 403);
      }

      const newMaxPoints = quizData !== undefined && post.type === "QUIZ"
        ? quizData.questions.reduce((sum: number, q: any) => sum + q.points, 0)
        : questionData !== undefined && post.type === "QUESTION"
          ? questionData.question.points
          : maxPoints !== undefined && post.type !== "QUIZ" && post.type !== "QUESTION"
            ? maxPoints
            : undefined;

      const updated = await prisma.post.update({
        where: { id: postId },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(chapterId !== undefined && { chapterId }),
          ...(assignedTo !== undefined && { assignedTo: assignedTo }),
          ...(quizData !== undefined && post.type === "QUIZ" && {
            quizData,
            maxPoints: newMaxPoints,
          }),
          ...(questionData !== undefined && post.type === "QUESTION" && {
            quizData: questionData,
            maxPoints: newMaxPoints,
          }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(maxPoints !== undefined && post.type !== "QUIZ" && post.type !== "QUESTION" && { maxPoints }),
        },
        include: { attachments: true },
      });

      if (maxPoints !== undefined && post.type === "ASSIGNMENT" && maxPoints !== post.maxPoints) {
        await prisma.submission.updateMany({
          where: { postId, gradedAt: { not: null } },
          data: { points: null, feedback: null, gradedAt: null },
        });
      }

      const shouldRegradeQuiz = quizData !== undefined && post.type === "QUIZ";
      const shouldRegradeQuestion = questionData !== undefined && post.type === "QUESTION"
        && questionData.answerType === "multiple_choice";

      if (shouldRegradeQuiz || shouldRegradeQuestion) {
        const submissions = await prisma.submission.findMany({
          where: { postId, gradedAt: { not: null } },
        });

        for (const sub of submissions) {
          if (!sub.content) continue;
          let answers: { answers: Record<string, number> };
          try {
            answers = typeof sub.content === "string" ? JSON.parse(sub.content) : sub.content;
          } catch {
            continue;
          }
          if (!answers.answers) continue;

          let totalEarned = 0;
          const results: { questionId: string; correct: boolean; earnedPoints: number }[] = [];

          if (shouldRegradeQuiz) {
            for (const question of quizData.questions) {
              const selectedIndex = answers.answers[question.id];
              const isCorrect = selectedIndex === question.correctIndex;
              const earned = isCorrect ? question.points : 0;
              totalEarned += earned;
              results.push({ questionId: question.id, correct: isCorrect, earnedPoints: earned });
            }
          } else {
            const q = questionData.question;
            const selectedIndex = answers.answers[q.id];
            const isCorrect = selectedIndex === q.correctIndex;
            totalEarned = isCorrect ? q.points : 0;
            results.push({ questionId: q.id, correct: isCorrect, earnedPoints: totalEarned });
          }

          await prisma.submission.update({
            where: { id: sub.id },
            data: {
              points: totalEarned,
              feedback: JSON.stringify({
                autoGraded: true,
                results,
                totalEarned,
                totalPossible: newMaxPoints,
              }),
              gradedAt: new Date(),
            },
          });
        }
      }

      await cacheDelPattern(`posts:${post.classId}:*`);

      await publishEvent(Events.POST_UPDATED, {
        postId: updated.id,
        classId: updated.classId,
        chapterId: updated.chapterId,
        title: updated.title,
        content: updated.content,
        type: updated.type,
        studyMaterialType: updated.studyMaterialType,
        attachmentNames: updated.attachments.map((a: any) => a.fileName),
        updatedAt: updated.updatedAt,
      });

      sendSuccess(res, updated, "Post updated");
    } catch (error) {
      console.error("Error updating post:", error);
      sendError(res, "Failed to update post", 500);
    }
  }

  static async getUpcomingDue(req: Request, res: Response) {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const posts = await prisma.post.findMany({
        where: {
          type: { in: ["ASSIGNMENT", "QUIZ", "QUESTION"] },
          dueDate: { gte: now, lte: in24h },
        },
        select: {
          id: true,
          classId: true,
          title: true,
          dueDate: true,
        },
      });

      sendSuccess(res, posts, "Upcoming assignments retrieved");
    } catch (error) {
      console.error("Error getting upcoming assignments:", error);
      sendError(res, "Failed to get upcoming assignments", 500);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const postId = req.params.postId as string;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return sendError(res, "Post not found", 404);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can delete posts", 403);
      }

      await prisma.post.delete({ where: { id: postId } });

      await cacheDelPattern(`posts:${post.classId}:*`);

      await publishEvent(Events.POST_DELETED, {
        postId: post.id,
        classId: post.classId,
      });

      sendSuccess(res, null, "Post deleted");
    } catch (error) {
      console.error("Error deleting post:", error);
      sendError(res, "Failed to delete post", 500);
    }
  }
}
