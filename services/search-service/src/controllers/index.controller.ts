import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { indexPost, updatePost, removePost, removeByClass, PostDocument } from "../utils/elastic";

export class IndexController {
  static async indexPostHandler(req: Request, res: Response) {
    try {
      const doc: PostDocument = req.body;
      await indexPost(doc);
      sendSuccess(res, null, "Post indexed", 201);
    } catch (error) {
      console.error("Error indexing post:", error);
      sendError(res, "Failed to index post", 500);
    }
  }

  static async updatePostHandler(req: Request, res: Response) {
    try {
      const postId = req.params.postId as string;
      await updatePost(postId, req.body);
      sendSuccess(res, null, "Post index updated");
    } catch (error) {
      console.error("Error updating post index:", error);
      sendError(res, "Failed to update post index", 500);
    }
  }

  static async removePostHandler(req: Request, res: Response) {
    try {
      const postId = req.params.postId as string;
      await removePost(postId);
      sendSuccess(res, null, "Post removed from index");
    } catch (error) {
      console.error("Error removing post from index:", error);
      sendError(res, "Failed to remove post from index", 500);
    }
  }

  static async removeByClassHandler(req: Request, res: Response) {
    try {
      const classId = req.params.classId as string;
      await removeByClass(classId);
      sendSuccess(res, null, "All posts for classroom removed from index");
    } catch (error) {
      console.error("Error removing posts by class:", error);
      sendError(res, "Failed to remove posts by class", 500);
    }
  }
}
