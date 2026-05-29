import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
}

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "eduspace-dev-secret";
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
};
