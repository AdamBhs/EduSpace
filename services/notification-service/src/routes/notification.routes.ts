import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { NotificationController } from "../controllers/notification.controller";
import { InternalController } from "../controllers/internal.controller";

const router = Router();

// User-facing (auth required)
router.get("/", authenticate, NotificationController.getMyNotifications);
router.get("/unread-count", authenticate, NotificationController.getUnreadCount);
router.put("/:notificationId/read", authenticate, NotificationController.markAsRead);
router.put("/read-all", authenticate, NotificationController.markAllAsRead);
router.delete("/all", authenticate, NotificationController.deleteAll);
router.delete("/:notificationId", authenticate, NotificationController.deleteNotification);

// Internal (called by other services / RabbitMQ consumers)
router.post("/internal/create", InternalController.create);
router.post("/internal/create-bulk", InternalController.createBulk);
router.delete("/internal/class/:classId", InternalController.deleteByClass);

export default router;
