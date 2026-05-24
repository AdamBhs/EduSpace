import { Router } from "express";
import { authenticate } from "../../../../shared/src/middleware/auth";
import { SearchController } from "../controllers/search.controller";
import { IndexController } from "../controllers/index.controller";

const router = Router();

// User-facing (auth + membership required)
router.get("/:classId", authenticate, SearchController.search);

// Internal (called by other services / RabbitMQ consumers)
router.post("/internal/index", IndexController.indexPostHandler);
router.put("/internal/index/:postId", IndexController.updatePostHandler);
router.delete("/internal/index/:postId", IndexController.removePostHandler);
router.delete("/internal/class/:classId", IndexController.removeByClassHandler);

export default router;
