// src/routes/comment.routes.ts
import { Router } from "express";
import { CommentController } from "../controllers/comment.controller";
import { authenticate } from "../../../../shared/src/middleware/auth";

const router = Router();

/**
 * @route   POST /api/comments
 * @desc    Add a comment to a post
 * @access  Protected
 */
router.post("/", authenticate, CommentController.createComment);

/**
 * @route   GET /api/comments/post/:postId
 * @desc    Get all comments for a post
 * @access  Protected
 */
router.get("/post/:postId", authenticate, CommentController.getCommentsByPost);

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment
 * @access  Protected
 */
router.put("/:commentId", authenticate, CommentController.updateComment);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete a comment
 * @access  Protected
 */
router.delete("/:commentId", authenticate, CommentController.deleteComment);

export default router;
