import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { publishEvent, Events } from "../../../../shared/src";
import { Role } from "../generated/prisma/enums";

export class ChapterController {
  static async getChapters(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!member) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const chapters = await prisma.chapter.findMany({
        where: { classId },
        orderBy: { position: "asc" },
      });

      sendSuccess(res, chapters, "Chapters retrieved");
    } catch (error) {
      console.error("Error getting chapters:", error);
      sendError(res, "Failed to get chapters", 500);
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const { name } = req.body;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!member || member.role !== Role.ADMIN) {
        return sendError(res, "Only admins can create chapters", 403);
      }

      const maxPos = await prisma.chapter.aggregate({
        where: { classId },
        _max: { position: true },
      });

      const chapter = await prisma.chapter.create({
        data: {
          classId,
          name,
          position: (maxPos._max.position ?? -1) + 1,
        },
      });

      sendSuccess(res, chapter, "Chapter created", 201);
    } catch (error) {
      console.error("Error creating chapter:", error);
      sendError(res, "Failed to create chapter", 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const chapterId = req.params.chapterId as string;
      const { name } = req.body;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!member || member.role !== Role.ADMIN) {
        return sendError(res, "Only admins can update chapters", 403);
      }

      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId, classId },
      });
      if (!chapter) {
        return sendError(res, "Chapter not found", 404);
      }

      if (chapter.name === "General" && chapter.position === 0) {
        return sendError(res, "Cannot rename the General chapter", 400);
      }

      const updated = await prisma.chapter.update({
        where: { id: chapterId },
        data: { name },
      });

      sendSuccess(res, updated, "Chapter updated");
    } catch (error) {
      console.error("Error updating chapter:", error);
      sendError(res, "Failed to update chapter", 500);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const chapterId = req.params.chapterId as string;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!member || member.role !== Role.ADMIN) {
        return sendError(res, "Only admins can delete chapters", 403);
      }

      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId, classId },
      });
      if (!chapter) {
        return sendError(res, "Chapter not found", 404);
      }

      if (chapter.name === "General" && chapter.position === 0) {
        return sendError(res, "Cannot delete the General chapter", 400);
      }

      const generalChapter = await prisma.chapter.findFirst({
        where: { classId, name: "General", position: 0 },
        select: { id: true },
      });

      await prisma.chapter.delete({ where: { id: chapterId } });

      await publishEvent(Events.CHAPTER_DELETED, {
        chapterId,
        classId,
        generalChapterId: generalChapter?.id,
      });

      sendSuccess(res, null, "Chapter deleted");
    } catch (error) {
      console.error("Error deleting chapter:", error);
      sendError(res, "Failed to delete chapter", 500);
    }
  }

  static async reorder(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const { chapterIds } = req.body;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!member || member.role !== Role.ADMIN) {
        return sendError(res, "Only admins can reorder chapters", 403);
      }

      await prisma.$transaction(
        (chapterIds as string[]).map((id: string, index: number) =>
          prisma.chapter.update({
            where: { id, classId },
            data: { position: index },
          }),
        ),
      );

      const chapters = await prisma.chapter.findMany({
        where: { classId },
        orderBy: { position: "asc" },
      });

      sendSuccess(res, chapters, "Chapters reordered");
    } catch (error) {
      console.error("Error reordering chapters:", error);
      sendError(res, "Failed to reorder chapters", 500);
    }
  }
}
