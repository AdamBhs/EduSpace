import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { GradeController } from "../controllers/grade.controller";

const router = Router();

router.get("/:classId/table", authenticate, GradeController.getGradeTable);

router.get("/:classId/categories", authenticate, GradeController.getCategories);

router.post("/:classId/categories", authenticate, GradeController.createCategory);

router.put(
  "/:classId/categories/:categoryId",
  authenticate,
  GradeController.updateCategory,
);

router.delete(
  "/:classId/categories/:categoryId",
  authenticate,
  GradeController.deleteCategory,
);

export default router;
