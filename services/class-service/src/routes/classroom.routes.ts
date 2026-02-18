// src/routes/classroom.routes.ts
import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import { createClassroomSchema } from "../../../../shared/src/utils/validationSchemas";
import { ClassroomController } from "../controllers/classroom.controller";

const router = Router();

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

export default router;
