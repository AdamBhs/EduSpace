import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: "../../../.env" });
export interface JwtPayload {
  userId: string;
  email: string;
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? "YIwkdNzvnwJYfkTAPeqtIQ==";

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    console.error("Invalid or expired token:", error);
    return null;
  }
};
