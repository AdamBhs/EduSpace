import { Request, Response } from "express";

// Kept to mirror user-service file structure.
export const uploadAvatar = async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: "Not implemented in class-service",
  });
};
