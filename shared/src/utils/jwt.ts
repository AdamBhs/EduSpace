import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: string;
  email: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
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
