import { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import { prisma } from "../db/prisma";
import { sendError, sendSuccess } from "../../../../shared/src/utils/response";
import dotenv from "dotenv";

dotenv.config();

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = req.user?.userId;

    if (!file) return sendError(res, "No File uploaded", 400);
    if (!userId) return sendError(res, "User not authenticated", 401);

    const formData = new FormData();
    formData.append("file", file.buffer, file.originalname);
    formData.append("entityType", "user");
    formData.append("entityId", userId);

    // Call the API of the File service for uploading to s3 in minIO
    const response = await axios.post(
      "http://localhost:3010/api/auth/avatar_url/upload",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: req.headers.authorization!, // pass JWT
        },
      },
    );

    const { fileId, key } = response.data.data;

    // Update user's avatar_url in user-pofile
    await prisma.user_profile.update({
      where: { user_id: userId },
      data: { avatar_url: key },
    });

    return sendSuccess(
      res,
      {
        fileId,
        avatarUrl: key,
      },
      "Avatar uploaded successfully",
      200,
    );
  } catch (error) {
    console.error(error);
    sendError(res, "Faild to Upload Avatar in User Service", 500);
  }
};
