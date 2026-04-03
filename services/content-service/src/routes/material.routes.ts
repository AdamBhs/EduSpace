// src/routes/material.routes.ts
import { Router } from "express";
import { MaterialController } from "../controllers/material.controller";
import { authenticate } from "../../../../shared/src/middleware/auth";

const router = Router();

/**
 * @route   POST /api/materials
 * @desc    Create a new material
 * @access  Protected
 */
router.post("/", authenticate, MaterialController.createMaterial);

/**
 * @route   GET /api/materials/class/:classId
 * @desc    Get all materials for a classroom (optional ?category= filter)
 * @access  Protected
 */
router.get("/class/:classId", authenticate, MaterialController.getMaterialsByClass);

/**
 * @route   GET /api/materials/:materialId
 * @desc    Get a single material by ID
 * @access  Protected
 */
router.get("/:materialId", authenticate, MaterialController.getMaterialById);

/**
 * @route   PUT /api/materials/:materialId
 * @desc    Update a material
 * @access  Protected
 */
router.put("/:materialId", authenticate, MaterialController.updateMaterial);

/**
 * @route   DELETE /api/materials/:materialId
 * @desc    Delete a material
 * @access  Protected
 */
router.delete("/:materialId", authenticate, MaterialController.deleteMaterial);

export default router;
