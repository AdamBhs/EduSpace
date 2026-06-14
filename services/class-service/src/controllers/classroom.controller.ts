import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { publishEvent, Events } from "../../../../shared/src";
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from "../../../../shared/src/utils/redis";
import { ClassroomType, Role } from "../generated/prisma/enums";
import { fetchUsers } from "../utils/userService";

function generateClassCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");
}

async function uniqueClassCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateClassCode();
    const exists = await prisma.classroom.findUnique({ where: { classCode: code } });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique class code");
}

export class ClassroomController {
  static async create(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { name, type, description, subject, section, chatEnabled } = req.body;

      const classCode = await uniqueClassCode();

      const classroom = await prisma.$transaction(async (tx: any) => {
        const newClass = await tx.classroom.create({
          data: {
            name,
            type: type as ClassroomType,
            classCode,
            description,
            subject,
            section,
            chatEnabled: chatEnabled ?? true,
            creatorId: userId,
          },
        });

        await tx.member.create({
          data: {
            classId: newClass.id,
            userId,
            role: Role.ADMIN,
          },
        });

        await tx.chapter.create({
          data: {
            classId: newClass.id,
            name: "General",
            position: 0,
            isGeneral: true,
          },
        });

        return newClass;
      });

      await publishEvent(Events.CLASSROOM_CREATED, {
        classId: classroom.id,
        name: classroom.name,
        chatEnabled: classroom.chatEnabled,
        creatorId: userId,
      });

      sendSuccess(res, classroom, "Classroom created", 201);
    } catch (error) {
      console.error("Error creating classroom:", error);
      sendError(res, "Failed to create classroom", 500);
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!member) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const cacheKey = `classroom:${classId}`;
      const cached = await cacheGet<any>(cacheKey);
      if (cached) {
        return sendSuccess(res, { ...cached, userRole: member.role }, "Classroom retrieved");
      }

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
        include: {
          chapters: { orderBy: { position: "asc" } },
          _count: { select: { members: true } },
        },
      });

      if (!classroom) {
        return sendError(res, "Classroom not found", 404);
      }

      await cacheSet(cacheKey, classroom, 300);

      sendSuccess(res, { ...classroom, userRole: member.role }, "Classroom retrieved");
    } catch (error) {
      console.error("Error getting classroom:", error);
      sendError(res, "Failed to get classroom", 500);
    }
  }

  static async getDeletionImpact(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const owned = await prisma.classroom.findMany({
        where: { creatorId: userId },
        include: {
          members: { select: { userId: true, role: true } },
        },
      });

      const transferable: { id: string; name: string }[] = [];
      const deletable: { id: string; name: string }[] = [];

      for (const c of owned) {
        const hasOtherAdmin = c.members.some(
          (m: any) => m.userId !== userId && m.role === "ADMIN",
        );
        if (hasOtherAdmin) {
          transferable.push({ id: c.id, name: c.name });
        } else {
          deletable.push({ id: c.id, name: c.name });
        }
      }

      sendSuccess(res, { transferable, deletable }, "Deletion impact retrieved");
    } catch (error) {
      console.error("Error getting deletion impact:", error);
      sendError(res, "Failed to get deletion impact", 500);
    }
  }

  static async getMyClassrooms(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      const memberships = await prisma.member.findMany({
        where: { userId },
        include: {
          classroom: {
            include: { _count: { select: { members: true } } },
          },
        },
        orderBy: { joinedAt: "desc" },
      });

      const creatorIds: string[] = [
        ...new Set<string>(memberships.map((m: any) => m.classroom.creatorId)),
      ];
      const creators = await fetchUsers(creatorIds, req.headers.authorization);
      const creatorById = new Map(creators.map((u: any) => [u.userId, u]));

      const classrooms = memberships.map((m: any) => ({
        classroom: m.classroom,
        role: m.role,
        creator: creatorById.get(m.classroom.creatorId) ?? null,
      }));

      sendSuccess(res, classrooms, "Classrooms retrieved");
    } catch (error) {
      console.error("Error getting classrooms:", error);
      sendError(res, "Failed to get classrooms", 500);
    }
  }

  static async join(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { classCode } = req.body;

      const classroom = await prisma.classroom.findUnique({
        where: { classCode },
      });

      if (!classroom) {
        return sendError(res, "Invalid class code", 404);
      }

      const existing = await prisma.member.findUnique({
        where: { classId_userId: { classId: classroom.id, userId } },
      });

      if (existing) {
        return sendError(res, "Already a member of this classroom", 409);
      }

      const member = await prisma.member.create({
        data: {
          classId: classroom.id,
          userId,
          role: Role.MEMBER,
        },
      });

      await cacheDel(`classroom:${classroom.id}`, `members:${classroom.id}`);

      sendSuccess(res, { member, classroom }, "Joined classroom", 201);
    } catch (error) {
      console.error("Error joining classroom:", error);
      sendError(res, "Failed to join classroom", 500);
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const { name, description, subject, section, chatEnabled, coverImage } = req.body;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });

      if (!member || member.role !== Role.ADMIN) {
        return sendError(res, "Only admins can update classroom settings", 403);
      }

      const classroom = await prisma.classroom.update({
        where: { id: classId },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(subject !== undefined && { subject }),
          ...(section !== undefined && { section }),
          ...(chatEnabled !== undefined && { chatEnabled }),
          ...(coverImage !== undefined && { coverImage }),
        },
      });

      await cacheDel(`classroom:${classId}`);

      if (chatEnabled !== undefined) {
        await publishEvent(Events.CHAT_TOGGLED, {
          classId,
          enabled: classroom.chatEnabled,
        });
      }

      await publishEvent(Events.CLASSROOM_UPDATED, {
        classId,
        name: classroom.name,
        description: classroom.description,
        subject: classroom.subject,
        section: classroom.section,
        chatEnabled: classroom.chatEnabled,
      });

      sendSuccess(res, classroom, "Classroom updated");
    } catch (error) {
      console.error("Error updating classroom:", error);
      sendError(res, "Failed to update classroom", 500);
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
      });

      if (!classroom) {
        return sendError(res, "Classroom not found", 404);
      }

      if (classroom.creatorId !== userId) {
        return sendError(res, "Only the classroom creator can delete it", 403);
      }

      await prisma.classroom.delete({ where: { id: classId } });

      await cacheDelPattern(`*:${classId}*`);

      await publishEvent(Events.CLASSROOM_DELETED, { classId });

      sendSuccess(res, null, "Classroom deleted");
    } catch (error) {
      console.error("Error deleting classroom:", error);
      sendError(res, "Failed to delete classroom", 500);
    }
  }

  static async leave(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
      });

      if (!classroom) {
        return sendError(res, "Classroom not found", 404);
      }

      if (classroom.creatorId === userId) {
        return sendError(res, "The creator cannot leave — delete the classroom instead", 400);
      }

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });

      if (!member) {
        return sendError(res, "Not a member of this classroom", 404);
      }

      await prisma.member.delete({
        where: { classId_userId: { classId, userId } },
      });

      await cacheDel(`classroom:${classId}`, `members:${classId}`);

      sendSuccess(res, null, "Left classroom");
    } catch (error) {
      console.error("Error leaving classroom:", error);
      sendError(res, "Failed to leave classroom", 500);
    }
  }
}
