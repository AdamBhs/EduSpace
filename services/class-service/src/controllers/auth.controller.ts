import { Request, Response } from "express";
import { prisma } from "../db/prisma";

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email?: string;
  };
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

const randomCode = (): string => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const isUuid = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
};

const generateClassCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const classCode = randomCode();
    const existingClass = await prisma.classroom.findUnique({
      where: { class_code: classCode },
    });

    if (!existingClass) {
      return classCode;
    }
  }

  throw new Error("Could not generate unique classroom code");
};

const parseMaterialCategories = (value: unknown): string[] => {
  const allowed = new Set([
    "lessons",
    "labs",
    "assignments",
    "announcements",
    "other",
  ]);

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

export class AuthController {
  static async createClassroom(req: Request, res: Response): Promise<void> {
    try {
      const teacherId = (req as AuthenticatedRequest).user?.userId;
      const {
        name,
        description,
        subject,
        section,
        chapter,
        materialCategories,
      } = req.body;

      if (!teacherId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      if (!isUuid(teacherId)) {
        sendError(res, "Invalid authenticated user id", 400);
        return;
      }

      if (typeof name !== "string" || !name.trim()) {
        sendError(res, "Classroom name is required", 400);
        return;
      }

      const classCode = await generateClassCode();

      const classroom = await prisma.classroom.create({
        data: {
          name,
          teacher_id: teacherId,
          class_code: classCode,
          description: typeof description === "string" ? description : null,
          subject: typeof subject === "string" ? subject : null,
          section: typeof section === "string" ? section : null,
          chapter: typeof chapter === "string" ? chapter : null,
          material_categories: parseMaterialCategories(materialCategories),
        },
      });

      sendSuccess(res, { classroom }, "Classroom created successfully", 201);
    } catch (error) {
      console.error("Create classroom error:", error);
      sendError(res, "Failed to create classroom", 500);
    }
  }
}
