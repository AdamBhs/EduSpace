import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  createClassroomSchema,
  updateClassroomSchema,
  joinClassroomSchema,
  createChapterSchema,
  updateChapterSchema,
  reorderChaptersSchema,
} from "../../../../shared/src/utils/validationSchemas";
import { ClassroomController } from "../controllers/classroom.controller";
import { MemberController } from "../controllers/member.controller";
import { ChapterController } from "../controllers/chapter.controller";

const router = Router();

// ─── Classrooms ─────────────────────────────────────────────

router.get("/my", authenticate, ClassroomController.getMyClassrooms);

router.post(
  "/create",
  authenticate,
  validate(createClassroomSchema),
  ClassroomController.create,
);

router.post(
  "/join",
  authenticate,
  validate(joinClassroomSchema),
  ClassroomController.join,
);

router.get("/:classId", authenticate, ClassroomController.getById);

router.put(
  "/:classId",
  authenticate,
  validate(updateClassroomSchema),
  ClassroomController.update,
);

router.delete("/:classId", authenticate, ClassroomController.delete);

router.post("/:classId/leave", authenticate, ClassroomController.leave);

// ─── Members ────────────────────────────────────────────────

router.get("/:classId/members", authenticate, MemberController.getMembers);

router.get(
  "/:classId/members/check/:userId",
  authenticate,
  MemberController.checkMembership,
);

router.put(
  "/:classId/members/:memberId/role",
  authenticate,
  MemberController.updateRole,
);

router.delete(
  "/:classId/members/:memberId",
  authenticate,
  MemberController.removeMember,
);

// ─── Chapters ───────────────────────────────────────────────

router.get("/:classId/chapters", authenticate, ChapterController.getChapters);

router.post(
  "/:classId/chapters",
  authenticate,
  validate(createChapterSchema),
  ChapterController.create,
);

router.put(
  "/:classId/chapters/reorder",
  authenticate,
  validate(reorderChaptersSchema),
  ChapterController.reorder,
);

router.put(
  "/:classId/chapters/:chapterId",
  authenticate,
  validate(updateChapterSchema),
  ChapterController.update,
);

router.delete(
  "/:classId/chapters/:chapterId",
  authenticate,
  ChapterController.delete,
);

export default router;
