// src/controllers/material.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";

export class MaterialController {
  /**
   * Create a new material
   * POST /api/materials
   */
  static async createMaterial(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { classId, title, description, category } = req.body;

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const material = await prisma.material.create({
        data: {
          class_id: classId,
          author_id: authorId,
          title,
          description,
          category,
        },
        include: {
          attachments: true,
        },
      });

      sendSuccess(
        res,
        {
          materialId: material.materialId,
          classId: material.class_id,
          authorId: material.author_id,
          title: material.title,
          description: material.description,
          category: material.category,
          attachments: material.attachments,
          createdAt: material.created_at,
        },
        "Material created successfully",
        201,
      );
    } catch (error) {
      console.error("Create material error:", error);
      sendError(res, "Failed to create material", 500);
    }
  }

  /**
   * Get all materials for a classroom
   * GET /api/materials/class/:classId
   */
  static async getMaterialsByClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params as { classId: string };
      const { category } = req.query;

      const where: any = { class_id: classId };
      if (category) where.category = category as string;

      const materials = await prisma.material.findMany({
        where,
        include: {
          attachments: true,
        },
        orderBy: { created_at: "desc" },
      });

      const formattedMaterials = materials.map((material) => ({
        materialId: material.materialId,
        classId: material.class_id,
        authorId: material.author_id,
        title: material.title,
        description: material.description,
        category: material.category,
        attachments: material.attachments,
        createdAt: material.created_at,
        updatedAt: material.updated_at,
      }));

      sendSuccess(res, formattedMaterials, "Materials retrieved successfully");
    } catch (error) {
      console.error("Get materials error:", error);
      sendError(res, "Failed to get materials", 500);
    }
  }

  /**
   * Get a single material by ID
   * GET /api/materials/:materialId
   */
  static async getMaterialById(req: Request, res: Response): Promise<void> {
    try {
      const { materialId } = req.params as { materialId: string };

      const material = await prisma.material.findUnique({
        where: { materialId },
        include: {
          attachments: true,
        },
      });

      if (!material) {
        sendError(res, "Material not found", 404);
        return;
      }

      sendSuccess(res, {
        materialId: material.materialId,
        classId: material.class_id,
        authorId: material.author_id,
        title: material.title,
        description: material.description,
        category: material.category,
        attachments: material.attachments,
        createdAt: material.created_at,
        updatedAt: material.updated_at,
      });
    } catch (error) {
      console.error("Get material error:", error);
      sendError(res, "Failed to get material", 500);
    }
  }

  /**
   * Update a material
   * PUT /api/materials/:materialId
   */
  static async updateMaterial(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { materialId } = req.params as { materialId: string };
      const { title, description, category } = req.body;

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const existing = await prisma.material.findUnique({
        where: { materialId },
      });

      if (!existing) {
        sendError(res, "Material not found", 404);
        return;
      }

      if (existing.author_id !== authorId) {
        sendError(res, "Not authorized to update this material", 403);
        return;
      }

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;

      const updatedMaterial = await prisma.material.update({
        where: { materialId },
        data: updateData,
        include: { attachments: true },
      });

      sendSuccess(res, {
        materialId: updatedMaterial.materialId,
        title: updatedMaterial.title,
        description: updatedMaterial.description,
        category: updatedMaterial.category,
        attachments: updatedMaterial.attachments,
        updatedAt: updatedMaterial.updated_at,
      }, "Material updated successfully");
    } catch (error) {
      console.error("Update material error:", error);
      sendError(res, "Failed to update material", 500);
    }
  }

  /**
   * Delete a material
   * DELETE /api/materials/:materialId
   */
  static async deleteMaterial(req: Request, res: Response): Promise<void> {
    try {
      const authorId = req.user?.userId;
      const { materialId } = req.params as { materialId: string };

      if (!authorId) {
        sendError(res, "User not authenticated", 401);
        return;
      }

      const existing = await prisma.material.findUnique({
        where: { materialId },
      });

      if (!existing) {
        sendError(res, "Material not found", 404);
        return;
      }

      if (existing.author_id !== authorId) {
        sendError(res, "Not authorized to delete this material", 403);
        return;
      }

      await prisma.material.delete({ where: { materialId } });

      sendSuccess(res, { message: "Material deleted successfully" });
    } catch (error) {
      console.error("Delete material error:", error);
      sendError(res, "Failed to delete material", 500);
    }
  }
}
