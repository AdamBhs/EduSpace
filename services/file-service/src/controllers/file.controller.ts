import { Request, Response } from "express";
import multer from "multer";
import { uploadFile } from "../services/s3.service";

const storage = multer.memoryStorage(); // store in memory before sending to S3
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

export const uploadAvatar = [
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No File uploaded" });
      }

      const userId = (req as any).user.id;
      const key = `avatars/${userId}-${Date.now()}-${req.file.originalname}`;

      // Upload to S3
      const avatarUrl = await uploadFile(req.file, key);

      // TODO: Save metadata in Postegres here
      const fileRecord = await prisma


      return res.status(201).json({ avatarUrl });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to upload avatar" });
    }
  },
];

export default uploadAvatar;
