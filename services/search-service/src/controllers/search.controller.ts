import { Request, Response } from "express";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { searchPosts } from "../utils/elastic";
import { checkMembership } from "../utils/classService";

export class SearchController {
  static async search(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const q = req.query.q as string;

      if (!q || q.trim().length === 0) {
        return sendError(res, "Search query is required", 400);
      }

      const isMember = await checkMembership(classId, userId, req.headers.authorization);
      if (!isMember) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const result = await searchPosts({
        classId,
        query: q.trim(),
        type: req.query.type as string | undefined,
        studyMaterialType: req.query.studyMaterialType as string | undefined,
        chapterId: req.query.chapterId as string | undefined,
        dateFrom: req.query.dateFrom as string | undefined,
        dateTo: req.query.dateTo as string | undefined,
        from: parseInt(req.query.from as string) || 0,
        size: Math.min(parseInt(req.query.size as string) || 20, 100),
      });

      sendSuccess(res, result, "Search results retrieved");
    } catch (error) {
      console.error("Error searching:", error);
      sendError(res, "Search failed", 500);
    }
  }
}
