import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { DmController } from "../controllers/dm.controller";

const router = Router();

router.get("/conversations", authenticate, DmController.getConversations);
router.post("/conversations", authenticate, DmController.createConversation);
router.get("/conversations/:conversationId/messages", authenticate, DmController.getMessages);
router.get("/conversations/:conversationId/reads", authenticate, DmController.getReads);
router.get("/conversations/:conversationId/files", authenticate, DmController.getSharedFiles);
router.get("/conversations/:conversationId/links", authenticate, DmController.getSharedLinks);
router.get("/friends", authenticate, DmController.getFriends);
router.get("/friends/status", authenticate, DmController.getFriendsWithStatus);

export default router;
