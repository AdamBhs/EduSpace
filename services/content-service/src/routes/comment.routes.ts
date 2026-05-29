import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../../../../shared/src/utils/validationSchemas";
import { CommentController } from "../controllers/comment.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createCommentSchema),
  CommentController.create,
);

router.get("/post/:postId", authenticate, CommentController.getByPost);

router.put(
  "/:commentId",
  authenticate,
  validate(updateCommentSchema),
  CommentController.update,
);

router.delete("/:commentId", authenticate, CommentController.delete);

export default router;
