import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { publishEvent, Events } from "../../../../shared/src";
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../../../../shared/src/utils/redis";
import { checkMembership } from "../utils/classService";

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

      if (type === "ASSIGNMENT" && membership.classroomType === "FRIENDLY") {
        return sendError(res, "Assignments are not available in friendly classrooms", 400);
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
          dueDate: dueDate ? new Date(dueDate) : null,
          maxPoints: type === "ASSIGNMENT" ? maxPoints : null,
          attachments: attachments?.length
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

      const cacheKey = `posts:${classId}:${type || ""}:${studyMaterialType || ""}:${chapterId || ""}:${sort || ""}`;
      const cached = await cacheGet<any>(cacheKey);
      if (cached) {
        return sendSuccess(res, cached, "Posts retrieved");
      }

      const where: any = { classId };
      if (type) where.type = type as string;
      if (studyMaterialType) where.studyMaterialType = studyMaterialType as string;
      if (chapterId) where.chapterId = chapterId as string;

      let orderBy: any = { createdAt: "desc" };
      if (sort === "title") orderBy = { title: "asc" };
      if (sort === "dueDate") orderBy = { dueDate: "asc" };

      const posts = await prisma.post.findMany({
        where,
        include: {
          attachments: true,
          _count: { select: { comments: true, submissions: true } },
        },
        orderBy,
      });

      await cacheSet(cacheKey, posts, 120);

      sendSuccess(res, posts, "Posts retrieved");
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
      const { title, content, chapterId, dueDate, maxPoints } = req.body;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return sendError(res, "Post not found", 404);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can update posts", 403);
      }

      const updated = await prisma.post.update({
        where: { id: postId },
        data: {
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
          ...(chapterId !== undefined && { chapterId }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
          ...(maxPoints !== undefined && { maxPoints }),
        },
        include: { attachments: true },
      });

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
