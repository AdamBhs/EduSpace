import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { sendSuccess, sendError } from "../../../../shared/src/utils/response";
import { uploadToS3, getPresignedUrl, deleteFromS3, getUploaderId } from "../services/s3";

export class FileController {
  static async upload(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return sendError(res, "No file uploaded", 400);
      }

      const fileId = uuid();
      const ext = file.originalname.split(".").pop() || "";
      const fileKey = `${fileId}${ext ? "." + ext : ""}`;

      await uploadToS3(fileKey, file.buffer, file.mimetype, req.user?.userId);
      const url = await getPresignedUrl(fileKey);

      sendSuccess(
        res,
        {
          fileKey,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          url,
        },
        "File uploaded",
        201,
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      sendError(res, "Failed to upload file", 500);
    }
  }

  static async uploadMultiple(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return sendError(res, "No files uploaded", 400);
      }

      const results = await Promise.all(
        files.map(async (file) => {
          const fileId = uuid();
          const ext = file.originalname.split(".").pop() || "";
          const fileKey = `${fileId}${ext ? "." + ext : ""}`;

          await uploadToS3(fileKey, file.buffer, file.mimetype, req.user?.userId);
          const url = await getPresignedUrl(fileKey);

          return {
            fileKey,
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            url,
          };
        }),
      );

      sendSuccess(res, results, "Files uploaded", 201);
    } catch (error) {
      console.error("Error uploading files:", error);
      sendError(res, "Failed to upload files", 500);
    }
  }

  static async getUrl(req: Request, res: Response) {
    try {
      const fileKey = req.params.fileKey as string;

      const url = await getPresignedUrl(fileKey);

      sendSuccess(res, { fileKey, url }, "Presigned URL generated");
    } catch (error) {
      console.error("Error generating URL:", error);
      sendError(res, "Failed to generate download URL", 500);
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const fileKey = req.params.fileKey as string;

      // Only the original uploader may delete; files uploaded before
      // uploader metadata existed stay deletable for compatibility
      const uploaderId = await getUploaderId(fileKey);
      if (uploaderId && uploaderId !== req.user?.userId) {
        return sendError(res, "Only the uploader can delete this file", 403);
      }

      await deleteFromS3(fileKey);

      sendSuccess(res, null, "File deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
      sendError(res, "Failed to delete file", 500);
    }
  }
}
