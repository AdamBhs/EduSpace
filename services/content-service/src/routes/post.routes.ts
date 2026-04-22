// src/routes/post.routes.ts
import { Router } from "express";
import { PostController } from "../controllers/post.controller";
import { authenticate } from "../../../../shared/src/middleware/auth";

const router = Router();

/**
 * @route   POST /api/posts/createPost
 * @desc    Create a new post (announcement or assignment)
 * @access  Protected
 */
router.post("/createPost", authenticate, PostController.createPost);

/**
 * @route   GET /api/posts/:classId
 * @desc    Get all posts for a classroom
 * @access  Protected
 */
router.get("/class/:classId", authenticate, PostController.getPostsByClass);

/**
 * @route   GET /api/posts/:postId
 * @desc    Get a single post by ID
 * @access  Protected
 */
router.get("/:postId", authenticate, PostController.getPostById);

/**
 * @route   PUT /api/posts/:postId
 * @desc    Update a post
 * @access  Protected
 */
router.put("/:postId", authenticate, PostController.updatePost);

/**
 * @route   DELETE /api/posts/:postId
 * @desc    Delete a post
 * @access  Protected
 */
router.delete("/:postId", authenticate, PostController.deletePost);

export default router;
