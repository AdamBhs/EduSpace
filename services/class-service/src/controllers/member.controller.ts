import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { Role } from "../generated/prisma/enums";
import { fetchUsers } from "../utils/userService";

export class MemberController {
  static async getMembers(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;

      const requester = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!requester) {
        return sendError(res, "Not a member of this classroom", 403);
      }

      const members = await prisma.member.findMany({
        where: { classId },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      });

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
        select: { creatorId: true, type: true },
      });

      const userIds = members.map((m: any) => m.userId as string);
      const users = await fetchUsers(userIds, req.headers.authorization);
      const userById = new Map(users.map((u: any) => [u.userId, u]));

      const result = members.map((m: any) => ({
        ...m,
        user: userById.get(m.userId) ?? null,
        isCreator: classroom?.creatorId === m.userId,
      }));

      sendSuccess(res, { members: result, classroomType: classroom?.type }, "Members retrieved");
    } catch (error) {
      console.error("Error getting members:", error);
      sendError(res, "Failed to get members", 500);
    }
  }

  static async updateRole(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const memberId = req.params.memberId as string;
      const { role } = req.body;

      const requester = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!requester || requester.role !== Role.ADMIN) {
        return sendError(res, "Only admins can change roles", 403);
      }

      const target = await prisma.member.findUnique({
        where: { id: memberId, classId },
      });
      if (!target) {
        return sendError(res, "Member not found", 404);
      }

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
        select: { creatorId: true },
      });
      if (target.userId === classroom?.creatorId) {
        return sendError(res, "Cannot change the creator's role", 403);
      }

      const updated = await prisma.member.update({
        where: { id: memberId },
        data: { role: role as Role },
      });

      // TODO: publish RabbitMQ event (member.role.changed)

      sendSuccess(res, updated, "Role updated");
    } catch (error) {
      console.error("Error updating role:", error);
      sendError(res, "Failed to update role", 500);
    }
  }

  static async removeMember(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classId = req.params.classId as string;
      const memberId = req.params.memberId as string;

      const requester = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });
      if (!requester || requester.role !== Role.ADMIN) {
        return sendError(res, "Only admins can remove members", 403);
      }

      const target = await prisma.member.findUnique({
        where: { id: memberId, classId },
      });
      if (!target) {
        return sendError(res, "Member not found", 404);
      }

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
        select: { creatorId: true },
      });
      if (target.userId === classroom?.creatorId) {
        return sendError(res, "Cannot remove the classroom creator", 403);
      }

      await prisma.member.delete({ where: { id: memberId } });

      // TODO: publish RabbitMQ event (member.removed)

      sendSuccess(res, null, "Member removed");
    } catch (error) {
      console.error("Error removing member:", error);
      sendError(res, "Failed to remove member", 500);
    }
  }

  static async checkMembership(req: Request, res: Response) {
    try {
      const classId = req.params.classId as string;
      const userId = req.params.userId as string;

      const member = await prisma.member.findUnique({
        where: { classId_userId: { classId, userId } },
      });

      if (!member) {
        return sendError(res, "Not a member", 403);
      }

      const classroom = await prisma.classroom.findUnique({
        where: { id: classId },
        select: { type: true, creatorId: true },
      });

      sendSuccess(res, {
        role: member.role,
        classroomType: classroom?.type,
        isCreator: classroom?.creatorId === userId,
      }, "Membership verified");
    } catch (error) {
      console.error("Error checking membership:", error);
      sendError(res, "Failed to check membership", 500);
    }
  }
}
