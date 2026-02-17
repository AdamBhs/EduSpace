import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthController } from "../controllers/auth.controller";

type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email?: string;
  };
};

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({ success: false, error: "JWT secret is missing" });
      return;
    }

    const decoded = jwt.verify(token, secret) as jwt.JwtPayload & {
      userId?: string;
      email?: string;
    };

    if (!decoded.userId) {
      res.status(401).json({ success: false, error: "Invalid token payload" });
      return;
    }

    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: typeof decoded.email === "string" ? decoded.email : undefined,
    };

    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
};

const router = Router();

/**
 * @route   POST /api/auth/create_classroom
 * @desc    Create a classroom
 * @access  Protected
 */
router.post("/create_classroom", authenticate, AuthController.createClassroom);

export default router;
