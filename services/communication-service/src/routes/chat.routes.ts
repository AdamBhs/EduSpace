import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { ChatController } from "../controllers/chat.controller";

const router = Router();

// User-facing (membership-gated)
router.get("/:classId/messages", authenticate, ChatController.getMessages);
router.get("/:classId/info", authenticate, ChatController.getRoomInfo);
router.get("/:classId/online", authenticate, ChatController.getOnlineMembers);
router.get("/:classId/reads", authenticate, ChatController.getReads);
router.get("/:classId/unread", authenticate, ChatController.getUnreadCount);
router.get("/:classId/pinned", authenticate, ChatController.getPinned);
router.get("/:classId/files", authenticate, ChatController.getSharedFiles);
router.get("/:classId/links", authenticate, ChatController.getSharedLinks);

// Internal (called by other services or RabbitMQ consumers)
router.post("/rooms", ChatController.createRoom);
router.put("/rooms/:classId/toggle", ChatController.toggleRoom);
router.delete("/rooms/:classId", ChatController.deleteRoom);

export default router;
