import { Router } from "express";
import uploadAvatar from "../controllers/file.controller";
import {authenticate} from '../../../../shared/src/middleware/auth';

const router = Router();


router.post('/avatar', authenticate, uploadAvatar)

export default router;