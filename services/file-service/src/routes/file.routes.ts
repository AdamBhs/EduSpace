import { Router } from "express";
import multer from "multer";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { FileController } from "../controllers/file.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  FileController.upload,
);

router.post(
  "/upload-multiple",
  authenticate,
  upload.array("files", 10),
  FileController.uploadMultiple,
);

router.get("/url/:fileKey", authenticate, FileController.getUrl);

router.delete("/:fileKey", authenticate, FileController.remove);

export default router;
