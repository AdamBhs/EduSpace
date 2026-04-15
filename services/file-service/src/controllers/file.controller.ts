import { Request, Response } from "express";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../services/s3_service";
import { prisma } from "../db/client";
import { v4 as uuid } from "uuid";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import dotenv from "dotenv";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

dotenv.config();
export class FileController {
  static async getAvatarUrl(req: Request, res: Response) {
    try {
      const userId = req.user?.userId; // From the JWT middleware

      const file = await prisma.file.findFirst({
        where: { entityId: userId, entityType: "avatar" },
        orderBy: { created_at: "desc" },
      });

      if (!file) {
        return sendError(res, "File not found", 404);
      }

      if (file.entityId !== userId) {
        return sendError(res, "Unauthorized", 403);
      }

      const command = new GetObjectCommand({
        Bucket: file.bucket,
        Key: file.key,
      });

      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return sendSuccess(res, { url }, "File Url generated", 200);
    } catch (error) {
      console.error(error);
      sendError(res, "Failed to get the file", 500);
    }
  }
  static async uploadFile(req: Request, res: Response) {
    try {
      const file = req.file;
      const { entityId, entityType } = req.body;

      if (!file) {
        return sendError(res, "No File uploaded", 400);
      }

      const fileId = uuid();
      const userId = entityId;
      const bucket = process.env.MINIO_BUCKET_PIC_PROFILE!;
      const key = `files/${fileId}$${userId}$${entityType}$${file.originalname}`;

      // Upload to MinIO
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      // Save to metaData in DB
      const savedFile = await prisma.file.create({
        data: {
          id: fileId,
          bucket,
          key,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          entityType: req.body.entityType,
          entityId: req.body.entityId,
        },
      });

      return sendSuccess(
        res,
        {
          fileId: savedFile.id,
          key: savedFile.key,
          
        },
        "File Upload successfuly",
        201,
      );
    } catch (error) {
      console.error(error);
      sendError(res, "Upload faild", 500);
    }
  }
}
