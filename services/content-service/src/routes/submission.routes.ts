import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  createSubmissionSchema,
  gradeSubmissionSchema,
} from "../../../../shared/src/utils/validationSchemas";
import { SubmissionController } from "../controllers/submission.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createSubmissionSchema),
  SubmissionController.submit,
);

router.put("/:submissionId", authenticate, SubmissionController.update);

router.get("/post/:postId", authenticate, SubmissionController.getByPost);

router.put(
  "/:submissionId/grade",
  authenticate,
  validate(gradeSubmissionSchema),
  SubmissionController.grade,
);

export default router;
