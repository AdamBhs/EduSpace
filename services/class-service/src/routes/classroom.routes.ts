// src/routes/classroom.routes.ts
import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import { createClassroomSchema } from "../../../../shared/src/utils/validationSchemas";
import { ClassroomController } from "../controllers/classroom.controller";

const router = Router();

/**
 * @route   Get /api/classroom/getClassroom
 * @desc    Getting Classroom by Id that the user enrolled in
 * @access  Protected
 */
router.get("/getClassroom", authenticate, ClassroomController.getClassroomById);

/**
 * @route   Get /api/classroom/getClassrooms
 * @desc    Getting all classrooms that the user enrolled in
 * @access  Protected
 */
router.get(
  "/getClassrooms",
  authenticate,
  ClassroomController.getAllEnrollClassroom,
);
/**
 * @route   POST /api/classroom/create
 * @desc    Create a classroom
 * @access  Protected
 */
router.post(
  "/create",
  authenticate,
  validate(createClassroomSchema),
  ClassroomController.createClassroom,
);

/**
 * @route   POST /api/classroom/join
 * @desc    join a classroom
 * @access  Protected
 */
router.get("/join", authenticate, ClassroomController.joinClassroom);

/**
 * @route   Get /api/classroom/getPeople
 * @desc    get people enrolled at classroom
 * @access  Protected
 */
router.post("/getPeople", authenticate, ClassroomController.getPeopleEnrolled);

export default router;
