import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { validate } from "../../../../shared/src/middleware/validate";
import {
  updateProfileSchema,
  batchUsersSchema,
} from "../../../../shared/src/utils/validationSchemas";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/me", authenticate, UserController.getProfile);

router.put(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  UserController.updateProfile,
);

router.delete("/me", authenticate, UserController.deleteAccount);

router.post(
  "/getUsers",
  authenticate,
  validate(batchUsersSchema),
  UserController.getUsers,
);

router.get("/:userId", authenticate, UserController.getUserById);

router.put(
  "/upload_avatar",
  authenticate,
  upload.single("file"),
  UserController.uploadAvatar,
);

export default router;
