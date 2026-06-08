import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { DmController } from "../controllers/dm.controller";

const router = Router();

router.get("/conversations", authenticate, DmController.getConversations);
router.post("/conversations", authenticate, DmController.createConversation);
router.get("/conversations/:conversationId/messages", authenticate, DmController.getMessages);
router.get("/friends", authenticate, DmController.getFriends);

export default router;
