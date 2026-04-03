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
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    console.error("Invalid or expired token:", error);
    return null;
  }
};
