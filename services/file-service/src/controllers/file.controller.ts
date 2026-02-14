import { Request, Response } from "express";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../services/s3_service";
import { prisma } from "../db/client";
import { v4 as uuid } from "uuid";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import dotenv from "dotenv";

dotenv.config();

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return sendError(res, "No File uploaded", 400);
    }
    const fileId = uuid();
    const bucket = process.env.MINIO_BUCKET!;
    const key = `files/${fileId}-${file.originalname}`;

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
};
