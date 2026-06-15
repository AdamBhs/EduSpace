import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { publishEvent, Events } from "../../../../shared/src";
import { checkMembership, fetchMemberIds } from "../utils/classService";

export class CommentController {
  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { postId, content, mentions } = req.body;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return sendError(res, "Post not found", 404);
      }

      const membership = await checkMembership(post.classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const comment = await prisma.comment.create({
        data: {
          postId,
          authorId: userId,
          content,
        },
      });

      // Notify mentioned users (validated against classroom membership, excluding self)
      if (Array.isArray(mentions) && mentions.length > 0) {
        const memberSet = new Set(await fetchMemberIds(post.classId));
        const mentionedUserIds = [...new Set(mentions as string[])].filter(
          (id) => id !== userId && memberSet.has(id),
        );
        if (mentionedUserIds.length > 0) {
          await publishEvent(Events.MENTION, {
            mentionedUserIds,
            mentionerId: userId,
            classId: post.classId,
            postId,
            preview: content || null,
            context: "comment",
          });
        }
      }

      sendSuccess(res, comment, "Comment created", 201);
    } catch (error) {
      console.error("Error creating comment:", error);
      sendError(res, "Failed to create comment", 500);
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

      const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
      });

      sendSuccess(res, comments, "Comments retrieved");
    } catch (error) {
      console.error("Error getting comments:", error);
      sendError(res, "Failed to get comments", 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const commentId = req.params.commentId as string;
      const { content } = req.body;

      const comment = await prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) {
        return sendError(res, "Comment not found", 404);
      }
      if (comment.authorId !== userId) {
        return sendError(res, "Can only edit your own comments", 403);
      }

      const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
      });

      sendSuccess(res, updated, "Comment updated");
    } catch (error) {
      console.error("Error updating comment:", error);
      sendError(res, "Failed to update comment", 500);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const commentId = req.params.commentId as string;

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { post: { select: { classId: true } } },
      });
      if (!comment) {
        return sendError(res, "Comment not found", 404);
      }

      const isOwner = comment.authorId === userId;
      if (!isOwner) {
        const membership = await checkMembership(
          comment.post.classId,
          userId,
          req.headers.authorization,
        );
        if (!membership || membership.role !== "ADMIN") {
          return sendError(res, "Only the author or an admin can delete comments", 403);
        }
      }

      await prisma.comment.delete({ where: { id: commentId } });

      sendSuccess(res, null, "Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      sendError(res, "Failed to delete comment", 500);
    }
  }
}
