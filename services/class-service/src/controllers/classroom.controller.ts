import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import axios from "axios";

async function generateClassCode(length = 8): Promise<string> {
  let classCode: string;
  let exists: Boolean = true;
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  while (exists) {
    classCode = Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join("");
    const found = await prisma.classroom.findUnique({
      where: { class_code: classCode },
    });
    if (!found) return classCode;
  }

  return "";
}

export class ClassroomController {
  static async getClassroomById(req: Request, res: Response) {
    try {
      const { classId } = req.params as { classId: string };
      const classroom = await prisma.classroom.findUnique({
        where: {
          classId: classId,
        },
      });
      sendSuccess(res, classroom, "Getting classroom by id successfully", 200);
    } catch (error) {
      console.error("Error getting classroom by id", error);
      sendError(res, "Error getting the classroom by id", 500);
    }
  }

  /**
   * GetAllEnrollClassroom
   * Get /api/classroom/getClassrooms
   */
  static async getAllEnrollClassroom(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const classes_enrolled = await prisma.enrollement.findMany({
        where: {
          user_id: userId,
        },
        include: {
          classroom: true,
        },
      });
      if (classes_enrolled.length === 0) {
        return sendSuccess(
          res,
          [],
          "Getting all classrooms enrolled succefully",
          200,
        );
      }
      const teacherIds = [
        ...new Set(
          classes_enrolled.map((enroll) => enroll.classroom.teacher_id),
        ),
      ];

      const teacherResponse = await axios.post(
        "http://localhost:3002/api/user/getUsers",
        { users_ids: teacherIds },
        { headers: { Authorization: req.headers.authorization } },
      );

      const teachers = Array.isArray(teacherResponse.data?.data)
        ? teacherResponse.data.data
        : [];
      const teacherById = new Map(
        teachers.map((teacher: { userId: string }) => [
          teacher.userId,
          teacher,
        ]),
      );

      const classrooms = classes_enrolled.map((enroll) => ({
        teacher: teacherById.get(enroll.classroom.teacher_id) ?? null,
        classroom: enroll.classroom,
      }));

      sendSuccess(
        res,
        classrooms,
        "Getting all classrooms enrolled succefully",
        200,
      );
    } catch (error) {
      console.error("Error getting all the classroom enrolled in : ", error);
      sendError(res, "Error getting all classroom", 500);
    }
  }
  /**
   * Join a Classroom
   * POST /api/classroom/join
   */
  static async joinClassroom(req: Request, res: Response) {
    try {
      const { class_code } = req.body;
      const userId = req.user!.userId;

      const userResponse = await axios.get(
        `http://localhost:3002/api/user/${userId}`,
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        },
      );

      if (!userResponse.data) {
        return sendError(res, "User not found", 404);
      }

      const classRoom = await prisma.classroom.findUnique({
        where: { class_code },
      });

      if (!classRoom) {
        return sendError(res, "Classroom not found", 404);
      }

      if (classRoom?.teacher_id === userId) {
        return sendError(res, "User can't Join a classroom he create", 422);
      }

      const existingEnrollment = await prisma.enrollement.findFirst({
        where: {
          class_id: classRoom.classId,
          user_id: userId,
        },
      });

      if (existingEnrollment) {
        return sendError(res, "User already joined this classroom", 422);
      }

      const enrollment = await prisma.enrollement.create({
        data: {
          class_id: classRoom.classId,
          user_id: userId,
        },
      });

      return sendSuccess(
        res,
        enrollment,
        "User joined classroom successfuly",
        201,
      );
    } catch (error) {
      console.error("Error joining classroom :", error);
      sendError(res, "Error joining Classroom", 400);
    }
  }
  /**
   * Create a new Classroom
   * POST /api/classroom/create
   */
  static async createClassroom(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;

      if (!userId) {
        sendError(res, "Error getting UserId", 400);
        return;
      }

      const {
        name,
        description,
        subject,
        section,
        chapter,
        material_categories,
      } = req.body;

      const classCode = await generateClassCode(8);

      const classroom = await prisma.$transaction(async (tx: any) => {
        const newClass = await tx.classroom.create({
          data: {
            name,
            teacher_id: userId,
            class_code: classCode,
            description,
            subject,
            section,
            chapter,
            material_categories: material_categories || [],
          },
        });

        await tx.enrollement.create({
          data: {
            class_id: newClass.classId,
            user_id: userId,
            role: "teacher",
          },
        });

        return newClass;
      });

      return sendSuccess(res, classroom, "Classroom Created successfully", 201);
    } catch (error) {
      console.error("Error Creating new Classroom", error);
      sendError(res, "Problem Creating classroom", 500);
    }
  }
  /**
   * Get people enrolled at classroom
   * Get /api/classroom/getPeople
   */
  static async getPeopleEnrolled(req: Request, res: Response) {
    try {
      const { classCode } = req.body;

      const classroom = await prisma.classroom.findUnique({
        where: { class_code: classCode },
      });

      if (!classroom) {
        return sendError(res, "Error finding the classroom", 404);
      }

      const enrolled = await prisma.enrollement.findMany({
        where: { class_id: classroom.classId },
      });

      const users_ids = enrolled.map((e) => e.user_id);

      const userResponse = await axios.post(
        "http://localhost:3002/api/user/getUsers",
        { users_ids },
        {
          headers: {
            Authorization: req.headers.authorization,
          },
        },
      );
      // TODO: I want to pass the roll for each student
      const roleByUserId = new Map(
        enrolled.map((enrollment) => [enrollment.user_id, enrollment.role]),
      );

      const usersWithRoles = Array.isArray(userResponse.data?.data)
        ? userResponse.data.data.map((user: { userId: string }) => ({
            ...user,
            role: roleByUserId.get(user.userId) ?? "student",
          }))
        : [];
      const mergedUserResponse = {
        ...userResponse.data,
        data: usersWithRoles,
      };

      return sendSuccess(
        res,
        mergedUserResponse,
        "Getting people enrolled in classroom successfuly",
        201,
      );
    } catch (error) {
      console.error("Error getting people enrolled :", error);
      sendError(res, "Error getting people by classroom ID", 500);
    }
  }

  /**
   * Delete Classroom By Id
   * Delete /api/classroom/:classId
   */
  static async deleteClassroomById(req: Request, res: Response) {
    try {
      const id = req.params.classId as string;

      const deleted = await prisma.classroom.delete({
        where: {
          classId: id,
        },
      });

      sendSuccess(res, deleted, "Deleting classroom successfuly", 201);
    } catch (error) {
      console.error("Error deleting classroom by Id : ", error);
      sendError(res, "Error deleting classroom by id", 500);
    }
  }
}
