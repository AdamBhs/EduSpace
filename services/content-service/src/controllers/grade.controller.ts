import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { checkMembership } from "../utils/classService";

export class GradeController {
  static async getCategories(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }
      if (membership.classroomType === "FRIENDLY") {
        return sendError(res, "Grades are not available in friendly classrooms", 400);
      }

      const categories = await prisma.gradeCategory.findMany({
        where: { classId },
        orderBy: { position: "asc" },
      });

      sendSuccess(res, categories, "Grade categories retrieved");
    } catch (error) {
      console.error("Error getting grade categories:", error);
      sendError(res, "Failed to get grade categories", 500);
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const { name, weight } = req.body;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can manage grade categories", 403);
      }
      if (membership.classroomType === "FRIENDLY") {
        return sendError(res, "Grades are not available in friendly classrooms", 400);
      }

      const maxPos = await prisma.gradeCategory.aggregate({
        where: { classId },
        _max: { position: true },
      });

      const category = await prisma.gradeCategory.create({
        data: {
          classId,
          name,
          weight,
          position: (maxPos._max.position ?? -1) + 1,
        },
      });

      sendSuccess(res, category, "Grade category created", 201);
    } catch (error) {
      console.error("Error creating grade category:", error);
      sendError(res, "Failed to create grade category", 500);
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const categoryId = req.params.categoryId as string;
      const { name, weight } = req.body;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can manage grade categories", 403);
      }

      const category = await prisma.gradeCategory.findUnique({
        where: { id: categoryId, classId },
      });
      if (!category) {
        return sendError(res, "Grade category not found", 404);
      }

      const updated = await prisma.gradeCategory.update({
        where: { id: categoryId },
        data: {
          ...(name !== undefined && { name }),
          ...(weight !== undefined && { weight }),
        },
      });

      sendSuccess(res, updated, "Grade category updated");
    } catch (error) {
      console.error("Error updating grade category:", error);
      sendError(res, "Failed to update grade category", 500);
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const categoryId = req.params.categoryId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership || membership.role !== "ADMIN") {
        return sendError(res, "Only admins can manage grade categories", 403);
      }

      const category = await prisma.gradeCategory.findUnique({
        where: { id: categoryId, classId },
      });
      if (!category) {
        return sendError(res, "Grade category not found", 404);
      }

      await prisma.gradeCategory.delete({ where: { id: categoryId } });

      sendSuccess(res, null, "Grade category deleted");
    } catch (error) {
      console.error("Error deleting grade category:", error);
      sendError(res, "Failed to delete grade category", 500);
    }
  }

  static async getGradeTable(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const membership = await checkMembership(classId, userId, req.headers.authorization);
      if (!membership) {
        return sendError(res, "Not a member of this classroom", 403);
      }
      if (membership.classroomType === "FRIENDLY") {
        return sendError(res, "Grades are not available in friendly classrooms", 400);
      }

      const assignments = await prisma.post.findMany({
        where: { classId, type: "ASSIGNMENT" },
        include: {
          submissions: {
            ...(membership.role === "MEMBER"
              ? { where: { studentId: userId } }
              : {}),
            select: {
              id: true,
              studentId: true,
              points: true,
              gradedAt: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const categories = await prisma.gradeCategory.findMany({
        where: { classId },
        orderBy: { position: "asc" },
      });

      sendSuccess(res, { assignments, categories }, "Grade table retrieved");
    } catch (error) {
      console.error("Error getting grade table:", error);
      sendError(res, "Failed to get grade table", 500);
    }
  }
}
