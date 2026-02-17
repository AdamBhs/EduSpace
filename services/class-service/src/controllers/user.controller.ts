import { Request, Response } from "express";
import { prisma } from "../db/prisma";

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email?: string;
  };
};

const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
};

const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (
  res: Response,
  error: string,
  statusCode: number = 400,
) => {
  return res.status(statusCode).json({
    success: false,
    error,
  });
};

const parseMaterialCategories = (value: unknown): string[] | undefined => {
  const allowed = new Set([
    "lessons",
    "labs",
    "assignments",
    "announcements",
    "other",
  ]);

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return [];
  }

  const categories = value
    .filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
    )
    .map((item) => item.trim().toLowerCase())
    .filter((item) => allowed.has(item));

  return Array.from(new Set(categories));
};

export class UserController {
  static async getClasses(req: Request, res: Response): Promise<void> {
    try {
      const teacherId =
        typeof req.query.teacherId === "string" ? req.query.teacherId : undefined;
      const subject =
        typeof req.query.subject === "string" ? req.query.subject : undefined;

      if (teacherId && !isUuid(teacherId)) {
        sendError(res, "Invalid teacherId", 400);
        return;
      }

      const classes = await prisma.classroom.findMany({
        where: {
          teacher_id: teacherId,
          subject,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      sendSuccess(res, { classes });
    } catch (error) {
      console.error("Get classes error:", error);
      sendError(res, "Failed to fetch classes", 500);
    }
  }

  static async getClassById(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;

      if (typeof classId !== "string") {
        sendError(res, "Invalid classId", 400);
        return;
      }

      if (!isUuid(classId)) {
        sendError(res, "Invalid classId format", 400);
        return;
      }

      const classroom = await prisma.classroom.findUnique({
        where: { classId },
      });

      if (!classroom) {
        sendError(res, "Classroom not found", 404);
        return;
      }

      sendSuccess(res, { classroom });
    } catch (error) {
      console.error("Get class by id error:", error);
      sendError(res, "Failed to fetch classroom", 500);
    }
  }

  static async updateClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.userId;

      if (typeof classId !== "string") {
        sendError(res, "Invalid classId", 400);
        return;
      }

      if (!isUuid(classId)) {
        sendError(res, "Invalid classId format", 400);
        return;
      }

      if (!userId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      if (!isUuid(userId)) {
        sendError(res, "Invalid authenticated user id", 400);
        return;
      }

      const existingClass = await prisma.classroom.findUnique({
        where: { classId },
      });

      if (!existingClass) {
        sendError(res, "Classroom not found", 404);
        return;
      }

      if (existingClass.teacher_id !== userId) {
        sendError(res, "Forbidden", 403);
        return;
      }

      const {
        name,
        description,
        subject,
        section,
        chapter,
        materialCategories,
        isArchived,
      } = req.body;

      const updateData: {
        name?: string;
        description?: string | null;
        subject?: string | null;
        section?: string | null;
        chapter?: string | null;
        material_categories?: string[];
        is_archived?: boolean;
      } = {};

      if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
          sendError(res, "name must be a non-empty string", 400);
          return;
        }

        updateData.name = name;
      }

      if (description !== undefined) {
        updateData.description = typeof description === "string" ? description : null;
      }

      if (subject !== undefined) {
        updateData.subject = typeof subject === "string" ? subject : null;
      }

      if (section !== undefined) {
        updateData.section = typeof section === "string" ? section : null;
      }

      if (chapter !== undefined) {
        updateData.chapter = typeof chapter === "string" ? chapter : null;
      }

      const parsedCategories = parseMaterialCategories(materialCategories);
      if (parsedCategories !== undefined) {
        updateData.material_categories = parsedCategories;
      }

      if (isArchived !== undefined) {
        if (typeof isArchived !== "boolean") {
          sendError(res, "isArchived must be a boolean", 400);
          return;
        }

        updateData.is_archived = isArchived;
      }

      if (Object.keys(updateData).length === 0) {
        sendError(res, "No valid fields provided for update", 400);
        return;
      }

      const classroom = await prisma.classroom.update({
        where: { classId },
        data: updateData,
      });

      sendSuccess(res, { classroom }, "Classroom updated successfully");
    } catch (error) {
      console.error("Update class error:", error);
      sendError(res, "Failed to update classroom", 500);
    }
  }

  static async deleteClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.userId;

      if (typeof classId !== "string") {
        sendError(res, "Invalid classId", 400);
        return;
      }

      if (!isUuid(classId)) {
        sendError(res, "Invalid classId format", 400);
        return;
      }

      if (!userId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      if (!isUuid(userId)) {
        sendError(res, "Invalid authenticated user id", 400);
        return;
      }

      const existingClass = await prisma.classroom.findUnique({
        where: { classId },
      });

      if (!existingClass) {
        sendError(res, "Classroom not found", 404);
        return;
      }

      if (existingClass.teacher_id !== userId) {
        sendError(res, "Forbidden", 403);
        return;
      }

      await prisma.classroom.delete({
        where: { classId },
      });

      sendSuccess(res, { classId }, "Classroom deleted successfully");
    } catch (error) {
      console.error("Delete class error:", error);
      sendError(res, "Failed to delete classroom", 500);
    }
  }
}
