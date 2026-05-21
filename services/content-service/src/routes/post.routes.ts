import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  createPostSchema,
  updatePostSchema,
} from "../../../../shared/src/utils/validationSchemas";
import { PostController } from "../controllers/post.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createPostSchema),
  PostController.create,
);

router.get("/class/:classId", authenticate, PostController.getByClass);

router.get("/:postId", authenticate, PostController.getById);

router.put(
  "/:postId",
  authenticate,
  validate(updatePostSchema),
  PostController.update,
);

router.delete("/:postId", authenticate, PostController.delete);

router.get("/internal/upcoming-due", PostController.getUpcomingDue);

export default router;
