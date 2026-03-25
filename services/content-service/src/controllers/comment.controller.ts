// src/controllers/comment.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";

export class CommentController {
  /**
   * Add a comment to a post
   * POST /api/comments
   */
  static async createComment(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { postId, content } = req.body;

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const post = await prisma.post.findUnique({
        where: { postId },
      });

      if (!post) {
        sendError(res, "Post not found", 404);
        return;
      }

      const comment = await prisma.comment.create({
        data: {
          post_id: postId,
          author_id: authorId,
          content,
        },
      });

      sendSuccess(
        res,
        {
          commentId: comment.commentId,
          postId: comment.post_id,
          authorId: comment.author_id,
          content: comment.content,
          createdAt: comment.created_at,
        },
        "Comment created successfully",
        201,
      );
    } catch (error) {
      console.error("Create comment error:", error);
      sendError(res, "Failed to create comment", 500);
    }
  }

  /**
   * Get all comments for a post
   * GET /api/comments/post/:postId
   */
  static async getCommentsByPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params as { postId: string };

      const comments = await prisma.comment.findMany({
        where: { post_id: postId },
        orderBy: { created_at: "asc" },
      });

      const formattedComments = comments.map((comment) => ({
        commentId: comment.commentId,
        postId: comment.post_id,
        authorId: comment.author_id,
        content: comment.content,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
      }));

      sendSuccess(res, formattedComments, "Comments retrieved successfully");
    } catch (error) {
      console.error("Get comments error:", error);
      sendError(res, "Failed to get comments", 500);
    }
  }

  /**
   * Update a comment
   * PUT /api/comments/:commentId
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { commentId } = req.params as { commentId: string };
      const { content } = req.body;

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const existing = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!existing) {
        sendError(res, "Comment not found", 404);
        return;
      }

      if (existing.author_id !== authorId) {
        sendError(res, "Not authorized to update this comment", 403);
        return;
      }

      const updatedComment = await prisma.comment.update({
        where: { commentId },
        data: { content },
      });

      sendSuccess(res, {
        commentId: updatedComment.commentId,
        content: updatedComment.content,
        updatedAt: updatedComment.updated_at,
      }, "Comment updated successfully");
    } catch (error) {
      console.error("Update comment error:", error);
      sendError(res, "Failed to update comment", 500);
    }
  }

  /**
   * Delete a comment
   * DELETE /api/comments/:commentId
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { commentId } = req.params as { commentId: string };

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const existing = await prisma.comment.findUnique({
        where: { commentId },
      });

      if (!existing) {
        sendError(res, "Comment not found", 404);
        return;
      }

      if (existing.author_id !== authorId) {
        sendError(res, "Not authorized to delete this comment", 403);
        return;
      }

      await prisma.comment.delete({ where: { commentId } });

      sendSuccess(res, { message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      sendError(res, "Failed to delete comment", 500);
    }
  }
}
