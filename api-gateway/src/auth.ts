import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../shared/src/utils/jwt";
import { sendError } from "../../shared/src/utils/response";

const PUBLIC_ROUTES = [
  { method: "POST", path: "/users/api/auth/register" },
  { method: "POST", path: "/users/api/auth/login" },
  { method: "POST", path: "/users/api/auth/verifyCode" },
  { method: "POST", path: "/users/api/auth/resendCode" },
  { method: "POST", path: "/users/api/auth/request-reset" },
  { method: "POST", path: "/users/api/auth/reset-password" },
];

function isPublicRoute(method: string, path: string): boolean {
  if (path === "/health") return true;

  return PUBLIC_ROUTES.some(
    (route) => route.method === method && path.startsWith(route.path),
  );
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "No token provided", 401);
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return sendError(res, "Invalid or expired token", 401);
  }

  req.headers["x-user-id"] = decoded.userId;
  req.headers["x-user-email"] = decoded.email;

  next();
};
