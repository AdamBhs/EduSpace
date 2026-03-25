// src/controllers/post.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";

export class PostController {
  /**
   * Create a new post (announcement or assignment)
   * POST /api/posts
   */
  static async createPost(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { classId, title, content, type } = req.body;

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const post = await prisma.post.create({
        data: {
          class_id: classId,
          author_id: authorId,
          title,
          content,
          type: type || "ANNOUNCEMENT",
        },
        include: {
          attachments: true,
        },
      });

      sendSuccess(
        res,
        {
          postId: post.postId,
          classId: post.class_id,
          authorId: post.author_id,
          title: post.title,
          content: post.content,
          type: post.type,
          attachments: post.attachments,
          createdAt: post.created_at,
        },
        "Post created successfully",
        201,
      );
    } catch (error) {
      console.error("Create post error:", error);
      sendError(res, "Failed to create post", 500);
    }
  }

  /**
   * Get all posts for a classroom
   * GET /api/posts/class/:classId
   */
  static async getPostsByClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params as { classId: string };

      const posts = await prisma.post.findMany({
        where: { class_id: classId },
        include: {
          attachments: true,
          comments: true,
        },
        orderBy: { created_at: "desc" },
      });

      const formattedPosts = posts.map((post: any) => ({
        postId: post.postId,
        classId: post.class_id,
        authorId: post.author_id,
        title: post.title,
        content: post.content,
        type: post.type,
        attachments: post.attachments,
        commentCount: post.comments.length,
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      }));

      sendSuccess(res, formattedPosts, "Posts retrieved successfully");
    } catch (error) {
      console.error("Get posts error:", error);
      sendError(res, "Failed to get posts", 500);
    }
  }

  /**
   * Get a single post by ID
   * GET /api/posts/:postId
   */
  static async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params as { postId: string };

      const post = await prisma.post.findUnique({
        where: { postId },
        include: {
          attachments: true,
          comments: {
            orderBy: { created_at: "asc" },
          },
        },
      });

      if (!post) {
        sendError(res, "Post not found", 404);
        return;
      }

      sendSuccess(res, {
        postId: post.postId,
        classId: post.class_id,
        authorId: post.author_id,
        title: post.title,
        content: post.content,
        type: post.type,
        attachments: post.attachments,
        comments: post.comments.map((c: any) => ({
          commentId: c.commentId,
          authorId: c.author_id,
          content: c.content,
          createdAt: c.created_at,
        })),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      });
    } catch (error) {
      console.error("Get post error:", error);
      sendError(res, "Failed to get post", 500);
    }
  }

  /**
   * Update a post
   * PUT /api/posts/:postId
   */
  static async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { postId } = req.params as { postId: string };
      const { title, content, type } = req.body;

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const existingPost = await prisma.post.findUnique({
        where: { postId },
      });

      if (!existingPost) {
        sendError(res, "Post not found", 404);
        return;
      }

      if (existingPost.author_id !== authorId) {
        sendError(res, "Not authorized to update this post", 403);
        return;
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (type !== undefined) updateData.type = type;

      const updatedPost = await prisma.post.update({
        where: { postId },
        data: updateData,
        include: { attachments: true },
      });

      sendSuccess(res, {
        postId: updatedPost.postId,
        title: updatedPost.title,
        content: updatedPost.content,
        type: updatedPost.type,
        attachments: updatedPost.attachments,
        updatedAt: updatedPost.updated_at,
      }, "Post updated successfully");
    } catch (error) {
      console.error("Update post error:", error);
      sendError(res, "Failed to update post", 500);
    }
  }

  /**
   * Delete a post
   * DELETE /api/posts/:postId
   */
  static async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { postId } = req.params as { postId: string };

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const existingPost = await prisma.post.findUnique({
        where: { postId },
      });

      if (!existingPost) {
        sendError(res, "Post not found", 404);
        return;
      }

      if (existingPost.author_id !== authorId) {
        sendError(res, "Not authorized to delete this post", 403);
        return;
      }

      await prisma.post.delete({ where: { postId } });

      sendSuccess(res, { message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete post error:", error);
      sendError(res, "Failed to delete post", 500);
    }
  }
}
